import { Show } from "@clerk/nextjs";
import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";

export default function Home() {
  return (
    <Suspense>
      <Show when="signed-out">
        <AuthGate />
      </Show>
      <Show when="signed-in">
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          <h1 className="text-2xl font-semibold">AI 뉴스</h1>
        </main>
      </Show>
    </Suspense>
  );
}
