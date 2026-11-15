import { Show } from "@clerk/nextjs";
import { Suspense } from "react";
import { ArticleList } from "@/components/article-list";
import { AuthGate } from "@/components/auth-gate";

export default function Home() {
  return (
    <Suspense>
      <Show when="signed-out">
        <AuthGate />
      </Show>
      <Show when="signed-in">
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold">AI 뉴스</h1>
          <Suspense
            fallback={
              <p className="py-16 text-center text-black/50 dark:text-white/50">
                기사를 불러오는 중...
              </p>
            }
          >
            <ArticleList />
          </Suspense>
        </main>
      </Show>
    </Suspense>
  );
}
