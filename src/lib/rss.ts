import Parser from "rss-parser";
import type { NewArticle } from "@/db/schema";

// PRD §4의 수집 대상 피드
const FEEDS = [
  {
    source: "TechCrunch",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    source: "The Verge",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
] as const;

const parser = new Parser({ timeout: 10_000 });

export type FetchResult = {
  articles: NewArticle[];
  failedSources: string[];
};

/** 두 피드를 병렬로 파싱해 최근 `hours`시간 이내 기사만 돌려준다. */
export async function fetchRecentArticles(hours = 24): Promise<FetchResult> {
  const since = Date.now() - hours * 60 * 60 * 1000;

  const results = await Promise.allSettled(
    FEEDS.map((feed) => parser.parseURL(feed.url)),
  );

  // URL 기준 중복 제거 (피드 간·피드 내 중복 모두 처리)
  const byUrl = new Map<string, NewArticle>();
  const failedSources: string[] = [];

  results.forEach((result, i) => {
    const { source } = FEEDS[i];
    if (result.status === "rejected") {
      failedSources.push(source);
      return;
    }
    for (const item of result.value.items) {
      if (!item.link || !item.title || !item.isoDate) continue;
      const publishedAt = new Date(item.isoDate);
      if (Number.isNaN(publishedAt.getTime())) continue;
      if (publishedAt.getTime() < since) continue;
      const url = normalizeUrl(item.link);
      if (byUrl.has(url)) continue;
      byUrl.set(url, {
        url,
        titleEn: item.title.trim(),
        source,
        publishedAt,
        // 임시: Claude 요약 기능 전까지 RSS 원문 요약을 summaryKo에 넣는다.
        summaryKo: toSummary(item.contentSnippet ?? item.content),
      });
    }
  });

  return { articles: [...byUrl.values()], failedSources };
}

/** 추적 파라미터·해시·끝 슬래시를 제거해 같은 기사가 같은 URL이 되게 한다. */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith("utm_")) u.searchParams.delete(key);
    }
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
    return u.toString();
  } catch {
    return raw.trim();
  }
}

/** HTML 태그를 제거하고 300자 이내로 자른다. 비어 있으면 null. */
function toSummary(text: string | undefined): string | null {
  if (!text) return null;
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return null;
  return plain.length > 300 ? `${plain.slice(0, 299)}…` : plain;
}
