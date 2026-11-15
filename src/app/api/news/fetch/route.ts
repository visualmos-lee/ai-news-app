import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { fetchRecentArticles } from "@/lib/rss";

// 인증은 src/proxy.ts가 /api(.*)에 대해 auth.protect()로 처리한다.
export async function POST() {
  const { articles: fetched, failedSources } = await fetchRecentArticles(24);

  // 두 피드가 모두 실패한 경우
  if (failedSources.length === 2) {
    return NextResponse.json(
      { error: "RSS 피드를 가져오지 못했습니다.", failedSources },
      { status: 502 },
    );
  }

  let inserted = 0;
  if (fetched.length > 0) {
    // url unique 제약 + onConflictDoNothing으로 중복 저장 방지
    const rows = await db
      .insert(articles)
      .values(fetched)
      .onConflictDoNothing({ target: articles.url })
      .returning({ id: articles.id });
    inserted = rows.length;
  }

  return NextResponse.json({
    fetched: fetched.length,
    inserted,
    failedSources,
  });
}
