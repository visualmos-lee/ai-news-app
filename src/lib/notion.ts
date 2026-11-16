import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type SaveInput = {
  title: string;
  summary: string | null;
  url: string;
  category: string | null;
  publishedAt: Date | null;
};

// 데이터베이스 ID → 데이터 소스 ID (Notion API 2025-09-03: 페이지는 data source 아래에 생성)
const dataSourceCache = new Map<string, string>();

/** 로컬 Notion MCP 서버(@notionhq/notion-mcp-server)를 stdio로 띄워 호출한다. */
async function withNotionClient<T>(fn: (client: Client) => Promise<T>) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["node_modules/@notionhq/notion-mcp-server/bin/cli.mjs"],
    env: { PATH: process.env.PATH ?? "", NOTION_TOKEN: token },
    stderr: "ignore",
  });
  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

/** MCP 도구를 호출하고 JSON 본문을 돌려준다. 오류 응답이면 throw. */
async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as { type: string; text?: string }[])
    .map((c) => (c.type === "text" ? (c.text ?? "") : ""))
    .join("");
  if (result.isError) throw new Error(`Notion MCP ${name} failed: ${text}`);
  return JSON.parse(text);
}

async function resolveDataSourceId(client: Client, databaseId: string) {
  const cached = dataSourceCache.get(databaseId);
  if (cached) return cached;
  const db = await callTool(client, "API-retrieve-a-database", {
    database_id: databaseId,
  });
  const id: string | undefined = db.data_sources?.[0]?.id;
  if (!id) throw new Error("Notion 데이터베이스에서 data source를 찾지 못했습니다.");
  dataSourceCache.set(databaseId, id);
  return id;
}

/** 기사를 Notion DB에 페이지로 만들고 page id를 반환한다. */
export async function createNewsPage(input: SaveInput): Promise<string> {
  // 환경변수에는 DB ID뿐 아니라 Notion URL을 붙여 넣는 경우가 많아, 32자리 ID만 추출한다.
  const databaseId = process.env.NOTION_DATABASE_ID?.match(
    /[0-9a-f]{32}|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/i,
  )?.[0];
  if (!databaseId) throw new Error("NOTION_DATABASE_ID is missing or invalid");

  return withNotionClient(async (client) => {
    const dataSourceId = await resolveDataSourceId(client, databaseId);

    const properties: Record<string, unknown> = {
      제목: { title: [{ text: { content: input.title.slice(0, 2000) } }] },
      출처: { url: input.url },
    };
    if (input.summary) {
      properties["요약"] = {
        rich_text: [{ text: { content: input.summary.slice(0, 2000) } }],
      };
    }
    if (input.category) {
      properties["카테고리"] = { select: { name: input.category } };
    }
    if (input.publishedAt) {
      properties["날짜"] = {
        date: { start: input.publishedAt.toISOString() },
      };
    }

    const page = await callTool(client, "API-post-page", {
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties,
    });
    return page.id as string;
  });
}
