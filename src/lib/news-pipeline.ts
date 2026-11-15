import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, type NewArticle } from "@/db/schema";
import { processArticles } from "./claude";
import type { RssArticle } from "./rss";

const BATCH_SIZE = 10;
const CONCURRENCY = 3;

// PRD §6.2 기본 카테고리 + 삭제 불가인 '미분류'
const DEFAULT_CATEGORIES = [
  "모델/연구",
  "제품/서비스",
  "투자/비즈니스",
  "규제/정책",
  "기타",
];
const UNCATEGORIZED = "미분류";

/** 사용자의 카테고리를 돌려준다. 하나도 없으면 기본 카테고리를 시드한다. */
export async function getOrSeedCategories(userId: string) {
  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));
  if (existing.length > 0) return existing;

  await db
    .insert(categories)
    .values([
      ...DEFAULT_CATEGORIES.map((name) => ({ userId, name })),
      { userId, name: UNCATEGORIZED, isUncategorized: true },
    ])
    .onConflictDoNothing();
  return db.select().from(categories).where(eq(categories.userId, userId));
}

export type PipelineResult = {
  rows: NewArticle[];
  failed: number; // 처리에 실패해 저장하지 않은 기사 수
};

/** 신규 기사를 배치로 Claude에 보내 번역·요약·분류한 저장용 행을 만든다. */
export async function enrichArticles(
  fresh: RssArticle[],
  userCategories: Awaited<ReturnType<typeof getOrSeedCategories>>,
): Promise<PipelineResult> {
  const selectable = userCategories.filter((c) => !c.isUncategorized);
  const idByName = new Map(selectable.map((c) => [c.name, c.id]));
  const uncategorizedId =
    userCategories.find((c) => c.isUncategorized)?.id ?? null;
  const names = selectable.map((c) => c.name);

  const batches: RssArticle[][] = [];
  for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
    batches.push(fresh.slice(i, i + BATCH_SIZE));
  }

  const rows: NewArticle[] = [];
  let failed = 0;

  // 동시성을 제한해 워커 CONCURRENCY개가 배치를 나눠 처리한다.
  let next = 0;
  const worker = async () => {
    while (next < batches.length) {
      const batch = batches[next++];
      try {
        const out = await processArticles(
          batch.map((a, id) => ({ id, title: a.titleEn, snippet: a.snippet })),
          names,
        );
        const byId = new Map(out.map((o) => [o.id, o]));
        batch.forEach((a, id) => {
          const o = byId.get(id);
          if (!o) {
            failed++; // 응답에서 누락 → 저장하지 않아 다음 수집 때 재시도
            return;
          }
          rows.push({
            url: a.url,
            titleEn: a.titleEn,
            source: a.source,
            publishedAt: a.publishedAt,
            titleKo: o.titleKo,
            summaryKo: o.summaryKo,
            categoryId: idByName.get(o.category) ?? uncategorizedId,
          });
        });
      } catch (err) {
        console.error("Claude 배치 처리 실패:", err);
        failed += batch.length;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker),
  );

  return { rows, failed };
}
