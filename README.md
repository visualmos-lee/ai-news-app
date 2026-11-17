# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고, Claude가 한국어로 번역·요약·카테고리 분류해 카드 형태로 보여주는 웹앱입니다. 마음에 드는 뉴스는 버튼 한 번으로 Notion에 저장할 수 있습니다.

## 주요 기능

- **로그인**: Clerk 인증 필수 (미로그인 시 모든 페이지 접근 차단)
- **뉴스 가져오기**: RSS 수집 → 한국어 번역/요약 → 자동 카테고리 분류 → 저장
- **카드 목록**: 한국어 제목, 요약, 출처, 발행일, 카테고리, 원문 링크 표시
- **카테고리 필터·관리**: 카테고리 추가/수정/삭제, 삭제 시 해당 뉴스는 '미분류'로 이동
- **Notion 저장**: 카드별 저장 버튼, 중복 저장 방지

## 뉴스 소스

- [TechCrunch AI](https://techcrunch.com/category/artificial-intelligence/feed/)
- [The Verge AI](https://www.theverge.com/rss/ai-artificial-intelligence/index.xml)

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router), React, TypeScript, Tailwind CSS |
| 로그인 | Clerk |
| 데이터베이스 | Neon (Postgres) + Drizzle ORM |
| 번역·요약·분류 | Claude API |
| Notion 저장 | Notion MCP 서버 |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채웁니다.

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
ANTHROPIC_API_KEY=
NOTION_TOKEN=
NOTION_DATABASE_ID=
```

### 3. 데이터베이스 마이그레이션

```bash
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | Drizzle Studio |

타입 검사는 `npx tsc --noEmit`으로 실행합니다.

## 구조

```
src/app/
├─ dashboard/          # 뉴스 카드 대시보드
└─ api/
   ├─ news/fetch/      # POST: RSS 수집 → Claude 번역·요약·분류 → 저장
   └─ notion/save/     # POST: Notion MCP로 페이지 생성
```

데이터는 공용 `articles`(URL 기준 유일)와 사용자별 `categories`, `notion_saves`(Clerk userId 기준)로 나뉩니다.

## 문서

- [`PRD.md`](./PRD.md): 요구사항과 구현 단계
- [`ui.md`](./ui.md): UI 스타일 가이드
