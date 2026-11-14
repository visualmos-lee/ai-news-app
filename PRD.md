# PRD: AI 뉴스 수집기

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude가 한국어로 번역·요약·카테고리 분류해 카드 형태로 보여주는 웹앱. 마음에 드는 뉴스는 Notion에 저장할 수 있다.

## 2. 목표
- 해외 AI 뉴스를 한국어로 빠르게 훑어볼 수 있게 한다.
- 카테고리별로 필요한 뉴스만 골라 본다.
- 중요한 뉴스는 버튼 한 번으로 Notion에 보관한다.

## 3. 주요 기능 (요구사항)
| ID | 기능 | 설명 |
|----|------|------|
| F1 | 로그인 | 앱 실행 시 Clerk 로그인 필수. 미로그인 시 모든 페이지 접근 차단 |
| F2 | 뉴스 가져오기 | '뉴스 가져오기' 버튼 클릭 시 RSS 수집 → 한국어 번역/요약 → 자동 카테고리 분류 → 저장 |
| F3 | 카드 목록 | 한국어 제목, 요약, 출처, 발행일, 카테고리, 원문 링크를 카드로 표시 |
| F4 | 카테고리 필터 | 선택한 카테고리의 뉴스만 표시 |
| F5 | 카테고리 관리 | 카테고리 추가·수정·삭제 (언제든 가능). 삭제 시 해당 뉴스는 '미분류'로 이동. 변경 후 재분류 지원 |
| F6 | Notion 저장 | 카드의 'Notion 저장' 버튼으로 선택한 뉴스를 Notion에 저장. 같은 뉴스 중복 저장 방지 |

## 4. 뉴스 소스
- TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/feed/
- The Verge AI: https://www.theverge.com/rss/ai-artificial-intelligence/index.xml

## 5. 기술 스택
| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 로그인 | Clerk |
| 데이터베이스 | Neon (Postgres) + Drizzle ORM |
| 번역·요약·분류 | Claude API |
| Notion 저장 | Notion MCP 서버 |

## 6. 설계 가정 (미확정, 변경 가능)
1. **Notion 연동**: 자체 실행 MCP 서버(@notionhq/notion-mcp-server + Integration 토큰)를 Next.js API 라우트에서 MCP 클라이언트로 호출. 대안: Notion 공식 API 직접 호출
2. **기본 카테고리**: 모델/연구, 제품/서비스, 투자/비즈니스, 규제/정책, 기타 (사용자가 수정 가능)
3. **사용자 분리**: 카테고리·Notion 설정은 Clerk userId 기준, 기사 원문은 공용 캐시

## 7. 데이터 모델
- `articles`: id, url(unique), title_en, source, published_at, title_ko, summary_ko, category_id, created_at
- `categories`: id, user_id, name, description, created_at
- `notion_saves`: id, user_id, article_id, notion_page_id, saved_at

## 8. 핵심 흐름
**뉴스 가져오기** (`POST /api/news/fetch`)
1. RSS 2곳 파싱
2. URL 기준으로 이미 저장된 기사 제외
3. 신규 기사를 배치로 Claude에 전달 → 한국어 제목·요약 + 사용자 카테고리 중 하나 선택(JSON 출력)
4. DB 저장 후 목록 갱신

**Notion 저장** (`POST /api/notion/save`)
1. 중복 저장 여부 확인
2. MCP로 페이지 생성 (제목, 한국어 요약, 원문 링크, 카테고리, 출처)
3. `notion_saves`에 기록

## 9. 화면 구성
- 헤더: 앱 이름, Clerk 사용자 메뉴
- 상단 바: '뉴스 가져오기' 버튼(로딩 상태), 카테고리 관리 버튼
- 카테고리 칩/탭 필터
- 뉴스 카드 그리드 (각 카드에 'Notion 저장' 버튼)
- 카테고리 관리 다이얼로그 (추가/수정/삭제)

## 10. 환경 변수
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`

## 11. 구현 단계
1. Next.js 프로젝트 생성, Clerk 연동·라우트 보호
2. Neon + Drizzle 스키마/마이그레이션
3. 카테고리 CRUD + 기본 시드
4. RSS 수집 + Claude 번역/요약/분류 + 저장
5. 카드 UI + 필터 + 가져오기 버튼
6. Notion MCP 연동 + 저장 버튼
7. 에러/로딩/중복 처리 다듬기

## 12. 수용 기준
- 로그아웃 상태 접근 시 로그인 화면으로 이동
- '뉴스 가져오기' 후 한국어 요약·카테고리가 표시되고, 재클릭해도 중복 기사가 생기지 않음
- 카테고리 필터, 추가, 수정, 삭제가 동작
- 'Notion 저장' 시 지정한 Notion DB에 페이지가 생성됨
- `npm run build`와 타입체크 통과

## 13. 범위 외 (현재)
- 자동 주기 수집(스케줄링), 추가 뉴스 소스 관리 UI, 모바일 앱
