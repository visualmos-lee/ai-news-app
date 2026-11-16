import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articles, categories, notionSaves } from "@/db/schema";
import { createNewsPage } from "@/lib/notion";

const bodySchema = z.object({ articleId: z.number().int().positive() });

// 인증은 src/proxy.ts가 /api(.*)에 대해 auth.protect()로 처리한다.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { articleId } = parsed.data;

  // 1. 중복 저장 확인
  const [existing] = await db
    .select({ id: notionSaves.id })
    .from(notionSaves)
    .where(
      and(eq(notionSaves.userId, userId), eq(notionSaves.articleId, articleId)),
    );
  if (existing) {
    return NextResponse.json({ saved: true, alreadySaved: true });
  }

  const [row] = await db
    .select({ article: articles, categoryName: categories.name })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.id, articleId));
  if (!row) {
    return NextResponse.json({ error: "기사를 찾을 수 없습니다." }, { status: 404 });
  }
  const { article, categoryName } = row;

  // 2. MCP로 Notion 페이지 생성
  let notionPageId: string;
  try {
    notionPageId = await createNewsPage({
      title: article.titleKo ?? article.titleEn,
      summary: article.summaryKo,
      url: article.url,
      category: categoryName,
      publishedAt: article.publishedAt,
    });
  } catch (e) {
    console.error("Notion save failed", e);
    return NextResponse.json(
      { error: "Notion에 저장하지 못했습니다." },
      { status: 502 },
    );
  }

  // 3. 저장 기록 (동시 요청은 unique 제약으로 무시)
  await db
    .insert(notionSaves)
    .values({ userId, articleId, notionPageId })
    .onConflictDoNothing({
      target: [notionSaves.userId, notionSaves.articleId],
    });

  return NextResponse.json({ saved: true, alreadySaved: false });
}
