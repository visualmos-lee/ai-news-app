import { Show } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";
import { DashboardContent } from "@/components/dashboard-content";

export const metadata: Metadata = {
  title: "대시보드 · AI 뉴스 수집기",
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  return (
    <Suspense>
      <Show when="signed-out">
        <AuthGate />
      </Show>
      <Show when="signed-in">
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <header className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">AI 뉴스 수집기</h1>
          </header>
          <Suspense
            fallback={
              <p className="py-16 text-center text-black/50 dark:text-white/50">
                기사를 불러오는 중...
              </p>
            }
          >
            <DashboardBody searchParams={searchParams} />
          </Suspense>
        </main>
      </Show>
    </Suspense>
  );
}

async function DashboardBody({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const raw = Array.isArray(category) ? category[0] : category;
  const id = raw ? Number(raw) : NaN;

  return <DashboardContent selectedId={Number.isInteger(id) ? id : null} />;
}
