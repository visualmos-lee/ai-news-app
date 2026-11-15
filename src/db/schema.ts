import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// 카테고리: Clerk userId 기준 사용자별 데이터
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    // '미분류' 행 식별용 (삭제 불가, 카테고리 삭제 시 기사 이동 대상)
    isUncategorized: boolean("is_uncategorized").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("categories_user_id_name_unique").on(t.userId, t.name),
    index("categories_user_id_idx").on(t.userId),
  ],
);

// 기사: 공용 캐시 (url 기준 유일)
export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull().unique(),
    titleEn: text("title_en").notNull(),
    source: text("source").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    titleKo: text("title_ko"),
    summaryKo: text("summary_ko"),
    // 앱 코드가 먼저 '미분류'로 옮기며, set null은 안전망
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("articles_category_id_idx").on(t.categoryId),
    index("articles_published_at_idx").on(t.publishedAt),
  ],
);

// Notion 저장 기록: 사용자별, 같은 기사 중복 저장 방지
export const notionSaves = pgTable(
  "notion_saves",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    notionPageId: text("notion_page_id").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("notion_saves_user_id_article_id_unique").on(t.userId, t.articleId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type NotionSave = typeof notionSaves.$inferSelect;
export type NewNotionSave = typeof notionSaves.$inferInsert;
