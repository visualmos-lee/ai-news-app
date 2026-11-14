# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Fresh `create-next-app` scaffold (Next.js 16, React 19, TypeScript, Tailwind CSS 4, App Router, `src/` dir, alias `@/*` → `src/*`). No app code yet. `PRD.md` (Korean) is the source of truth for scope: an AI news collector that fetches RSS (TechCrunch AI, The Verge AI), has Claude translate/summarize/categorize into Korean, shows cards with category filters, and saves to Notion. The PRD's §11 lists implementation steps in order; follow them one at a time.

Planned stack (not yet installed): Clerk (auth, all routes protected), Neon Postgres + Drizzle ORM, Claude API (`ANTHROPIC_API_KEY`), Notion MCP server (`NOTION_TOKEN`, `NOTION_DATABASE_ID`). Env var list is in PRD §10.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (PRD acceptance requires this plus typechecking to pass)
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- Typecheck: `npx tsc --noEmit`
- No test runner is configured yet.

## Next.js version caveat

`AGENTS.md` warns this Next.js has breaking changes versus common training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (routing, middleware/proxy, caching, etc.) and heed deprecation notices.

## Architecture notes from the PRD

- Data is split by scope: `articles` are a shared cache (unique by `url`); `categories` and `notion_saves` are per Clerk `userId`.
- Deleting a category moves its articles to "미분류" (uncategorized); category changes support re-classification.
- Fetch flow (`POST /api/news/fetch`): parse both RSS feeds → drop URLs already stored → send new articles to Claude in batches, requesting JSON (Korean title/summary + one of the user's categories) → save.
- Notion flow (`POST /api/notion/save`): check `notion_saves` for duplicates → create the page via MCP client → record it.
