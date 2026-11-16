import type { Article } from "@/db/schema";
import { SaveNewsButton } from "./save-news-button";

type ArticleCardProps = {
  article: Article;
  categoryName: string | null;
  saved?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});

export function ArticleCard({
  article,
  categoryName,
  saved = false,
}: ArticleCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-black/[.08] p-5 dark:border-white/[.145]">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-black/[.05] px-2.5 py-1 font-medium dark:bg-white/[.1]">
          {categoryName ?? "미분류"}
        </span>
        <span className="text-black/50 dark:text-white/50">
          {article.source}
          {article.publishedAt
            ? ` · ${dateFormatter.format(article.publishedAt)}`
            : ""}
        </span>
      </div>

      <h2 className="text-lg font-semibold leading-snug">
        {article.titleKo ?? article.titleEn}
      </h2>
      {article.titleKo && (
        <p className="text-xs text-black/50 dark:text-white/50">
          {article.titleEn}
        </p>
      )}

      {article.summaryKo && (
        <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
          {article.summaryKo}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          원문 보기 →
        </a>
        <SaveNewsButton articleId={article.id} initialSaved={saved} />
      </div>
    </article>
  );
}
