import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { ArticleCard } from "./article-card";
import { CategoryBar } from "./category-bar";

/**
 * 대시보드 본문: 카테고리 바 + 최신순 기사 카드 그리드.
 * TODO: 카테고리는 사용자별 데이터이므로, 인증 연동 후 현재 userId로 필터링한다.
 *       지금은 예제 데이터(user_sample_001)가 보이도록 userId 조건 없이 조회한다.
 */
export async function DashboardContent({
  selectedId,
}: {
  selectedId: number | null;
}) {
  const categoryRows = await db.select().from(categories).orderBy(categories.id);
  const selected = categoryRows.find((c) => c.id === selectedId) ?? null;

  // 미분류 카테고리는 category_id가 비어 있는 기사도 함께 보여준다.
  const filter = !selected
    ? undefined
    : selected.isUncategorized
      ? or(eq(articles.categoryId, selected.id), isNull(articles.categoryId))
      : eq(articles.categoryId, selected.id);

  const rows = await db
    .select({ article: articles, categoryName: categories.name })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(filter)
    .orderBy(desc(articles.publishedAt), desc(articles.id));

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
            />
          ))}
        </div>
      )}
    </>
  );
}
