"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

/** 로그아웃 상태에서 보이는 화면. 진입 즉시 로그인 모달을 연다. */
export function AuthGate() {
  const { openSignIn, loaded } = useClerk();

  useEffect(() => {
    if (loaded) openSignIn({});
  }, [loaded, openSignIn]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-32">
      <h1 className="text-2xl font-semibold">로그인이 필요합니다</h1>
      <button
        type="button"
        onClick={() => openSignIn({})}
        className="h-11 rounded-full bg-foreground px-6 text-background"
      >
        로그인
      </button>
    </div>
  );
}
