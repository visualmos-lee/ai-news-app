import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { ArticleCard } from "./article-card";

/**
 * 저장된 기사를 카드 그리드로 보여준다. (요청 시점에 DB 조회 → Suspense 안에서 사용)
 * TODO: 카테고리는 사용자별 데이터이므로, 인증 연동 후 현재 userId로 필터링한다.
 *       지금은 예제 데이터(user_sample_001)가 보이도록 category id로만 조인한다.
 */
export async function ArticleList() {
  const rows = await db
    .select({ article: articles, categoryName: categories.name })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .orderBy(desc(articles.publishedAt));

  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-black/50 dark:text-white/50">
        아직 수집된 기사가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(({ article, categoryName }) => (
        <ArticleCard
          key={article.id}
          article={article}
          categoryName={categoryName}
        />
      ))}
    </div>
  );
}
