"use client";

import { useState } from "react";

const base =
  "rounded-full border border-black/[.08] px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/[.145]";

export function SaveNewsButton({
  articleId,
  initialSaved,
}: {
  articleId: number;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notion/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
    } catch {
      setError("저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className={`${base} cursor-default bg-black/[.05] text-black/50 dark:bg-white/[.1] dark:text-white/50`}
      >
        저장됨
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className={`${base} hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.08]`}
      >
        {loading ? "저장 중..." : "뉴스 저장"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
