"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "done"; message: string }
  | { type: "error"; message: string };

export function FetchNewsButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleClick() {
    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      if (!res.ok) throw new Error("fetch failed");
      const data: { inserted: number; failedSources: string[] } =
        await res.json();
      const partial =
        data.failedSources.length > 0
          ? ` (${data.failedSources.join(", ")} 실패)`
          : "";
      setStatus({
        type: "done",
        message:
          (data.inserted > 0
            ? `${data.inserted}건 새로 저장했습니다.`
            : "새 기사가 없습니다.") + partial,
      });
      router.refresh();
    } catch {
      setStatus({
        type: "error",
        message: "뉴스를 가져오지 못했습니다. 다시 시도해 주세요.",
      });
    }
  }

  const loading = status.type === "loading";

  return (
    <div className="flex items-center gap-3">
      <p
        role="status"
        className={
          status.type === "error"
            ? "text-sm text-red-600 dark:text-red-400"
            : "text-sm text-black/50 dark:text-white/50"
        }
      >
        {status.type === "done" || status.type === "error"
          ? status.message
          : ""}
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="rounded-full border border-black/[.08] px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.08]"
      >
        {loading ? "가져오는 중..." : "뉴스 가져오기"}
      </button>
    </div>
  );
}
