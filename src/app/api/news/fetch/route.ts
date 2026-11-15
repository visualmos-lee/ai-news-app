import { auth } from "@clerk/nextjs/server";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { enrichArticles, getOrSeedCategories } from "@/lib/news-pipeline";
import { fetchRecentArticles } from "@/lib/rss";

// 인증은 src/proxy.ts가 /api(.*)에 대해 auth.protect()로 처리한다.
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { articles: fetched, failedSources } = await fetchRecentArticles(24);

  // 두 피드가 모두 실패한 경우
  if (failedSources.length === 2) {
    return NextResponse.json(
      { error: "RSS 피드를 가져오지 못했습니다.", failedSources },
      { status: 502 },
    );
  }

  // 이미 저장된 url은 Claude에 보내지 않는다 (비용 절감)
  const existing =
    fetched.length > 0
      ? await db
          .select({ url: articles.url })
          .from(articles)
          .where(inArray(articles.url, fetched.map((a) => a.url)))
      : [];
  const known = new Set(existing.map((e) => e.url));
  const fresh = fetched.filter((a) => !known.has(a.url));

  let inserted = 0;
  let failed = 0;
  if (fresh.length > 0) {
    const userCategories = await getOrSeedCategories(userId);
    const result = await enrichArticles(fresh, userCategories);
    failed = result.failed;

    if (result.rows.length > 0) {
      // url unique 제약 + onConflictDoNothing으로 동시 요청 중복도 방지
      const rows = await db
        .insert(articles)
        .values(result.rows)
        .onConflictDoNothing({ target: articles.url })
        .returning({ id: articles.id });
      inserted = rows.length;
    }
  }

  return NextResponse.json({
    fetched: fetched.length,
    new: fresh.length,
    inserted,
    failed,
    failedSources,
  });
}
