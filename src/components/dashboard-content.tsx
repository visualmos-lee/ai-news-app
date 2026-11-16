import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, notionSaves } from "@/db/schema";
import { ArticleCard } from "./article-card";
import { CategoryBar } from "./category-bar";
import { Pagination } from "./pagination";

/** 한 페이지에 보여줄 기사 카드 수 */
const PAGE_SIZE = 12;

/**
 * 대시보드 본문: 카테고리 바 + 최신순 기사 카드 그리드.
 * TODO: 카테고리는 사용자별 데이터이므로, 인증 연동 후 현재 userId로 필터링한다.
 *       지금은 예제 데이터(user_sample_001)가 보이도록 userId 조건 없이 조회한다.
 */
export async function DashboardContent({
  selectedId,
  page,
}: {
  selectedId: number | null;
  page: number;
}) {
  const categoryRows = await db.select().from(categories).orderBy(categories.id);
  const selected = categoryRows.find((c) => c.id === selectedId) ?? null;

  // 미분류 카테고리는 category_id가 비어 있는 기사도 함께 보여준다.
  const filter = !selected
    ? undefined
    : selected.isUncategorized
      ? or(eq(articles.categoryId, selected.id), isNull(articles.categoryId))
      : eq(articles.categoryId, selected.id);

  const [{ total }] = await db
    .select({ total: count() })
    .from(articles)
    .where(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // 범위를 넘어선 page(예: ?page=999)는 마지막 페이지로 맞춘다.
  const currentPage = Math.min(page, totalPages);

  const rows = await db
    .select({ article: articles, categoryName: categories.name })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(filter)
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  // 현재 사용자가 이미 Notion에 저장한 기사
  const { userId } = await auth();
  const savedRows =
    userId && rows.length > 0
      ? await db
          .select({ articleId: notionSaves.articleId })
          .from(notionSaves)
          .where(
            and(
              eq(notionSaves.userId, userId),
              inArray(
                notionSaves.articleId,
                rows.map((r) => r.article.id),
              ),
            ),
          )
      : [];
  const savedIds = new Set(savedRows.map((r) => r.articleId));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (selected) params.set("category", String(selected.id));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  return (
    <>
      <CategoryBar categories={categoryRows} selectedId={selected?.id ?? null} />

      {rows.length === 0 ? (
        <p className="py-16 text-center text-black/50 dark:text-white/50">
          {selected
            ? "이 카테고리에 기사가 없습니다."
            : "아직 수집된 기사가 없습니다."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ article, categoryName }) => (
            <ArticleCard
              key={article.id}
              article={article}
              categoryName={categoryName}
              saved={savedIds.has(article.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        hrefFor={hrefFor}
      />
    </>
  );
}
