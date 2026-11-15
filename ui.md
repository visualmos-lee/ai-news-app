# UI 가이드 — AI 뉴스 수집기

앱 이름: **AI 뉴스 수집기**
메인 화면: 뉴스를 카드 형태로 보여 주는 **대시보드** (`src/app/page.tsx`).
스타일링: **Tailwind CSS 4** (유틸리티 클래스 직접 사용, `globals.css`의 `@theme inline` 토큰 활용).

## 1. 디자인 원칙

- **깔끔함**: 장식 최소화. 테두리는 얇고 옅게, 그림자는 쓰지 않거나 아주 약하게.
- **읽기 편함**: 본문은 충분한 행간(`leading-relaxed`)과 넉넉한 여백. 한 카드에 정보를 몰아넣지 않는다.
- **위계 명확**: 제목 > 요약 > 메타 정보(출처·날짜) 순으로 크기와 명도 차이를 둔다.
- **라이트/다크 동시 지원**: 모든 색은 `dark:` 변형을 함께 지정한다 (`prefers-color-scheme` 기반).
- **한국어 우선**: 한글 제목·요약이 주(主), 영문 원제는 보조 정보로 작게 표시.

## 2. 디자인 토큰

### 색상
`globals.css`의 CSS 변수를 기준으로 하고, 보조 색은 투명도로 만든다.

| 용도 | 라이트 | 다크 |
| --- | --- | --- |
| 배경 | `bg-background` (#ffffff) | (#0a0a0a) |
| 본문 텍스트 | `text-foreground` (#171717) | (#ededed) |
| 보조 텍스트 | `text-black/50` | `dark:text-white/50` |
| 요약 텍스트 | `text-black/70` | `dark:text-white/70` |
| 테두리 | `border-black/[.08]` | `dark:border-white/[.145]` |
| 칩/뱃지 배경 | `bg-black/[.05]` | `dark:bg-white/[.1]` |
| 호버 배경 | `hover:bg-black/[.04]` | `dark:hover:bg-white/[.08]` |
| 선택(강조) | `bg-foreground text-background` | 동일 (자동 반전) |

> 포인트 색은 도입하지 않는다. 선택된 상태는 `foreground`/`background` 반전으로 표현해 단정한 인상을 유지한다.

### 타이포그래피
| 요소 | 클래스 |
| --- | --- |
| 앱 이름(헤더) | `text-2xl font-semibold` |
| 카드 제목 | `text-lg font-semibold leading-snug` |
| 요약 | `text-sm leading-relaxed` |
| 메타/원제/칩 | `text-xs` |
| 링크 | `text-sm font-medium underline-offset-4 hover:underline` |

### 모서리·간격
- 카드: `rounded-2xl`, 칩/버튼: `rounded-full`
- 카드 내부 패딩 `p-5`, 요소 간 `gap-3`
- 카드 그리드 간격 `gap-4`
- 페이지 컨테이너: `mx-auto w-full max-w-5xl px-6 py-10`

## 3. 대시보드 레이아웃

위에서 아래로 한 열로 쌓는다.

```
┌──────────────────────────────────────────────┐
│ AI 뉴스 수집기                      [사용자]   │  ← 헤더
│                                              │
│ [전체] [모델] [서비스] [연구] [미분류] [+ 추가] │  ← 카테고리 바
│                                              │
│ ┌──────────────┐  ┌──────────────┐           │
│ │ 뉴스 카드     │  │ 뉴스 카드     │           │  ← 카드 그리드
│ └──────────────┘  └──────────────┘           │     (모바일 1열 / sm 이상 2열)
│ ┌──────────────┐  ┌──────────────┐           │
│ │ 뉴스 카드     │  │ 뉴스 카드     │           │
│ └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────┘
```

### 3.1 헤더
- 좌측: 앱 이름 **AI 뉴스 수집기** (`<h1 className="text-2xl font-semibold">`).
- 우측: Clerk 사용자 버튼. 이후 "새 뉴스 가져오기" 버튼을 같은 줄 우측에 둔다.
- 헤더와 카테고리 바 사이 간격 `mb-6`.

```tsx
<header className="mb-6 flex items-center justify-between gap-4">
  <h1 className="text-2xl font-semibold">AI 뉴스 수집기</h1>
  {/* 우측 액션 영역 */}
</header>
```

### 3.2 카테고리 바 (뉴스 카드 목록 바로 위)
- 가로로 나열하는 **칩(pill)** 형태. 맨 앞은 항상 **전체**, 그다음 사용자 카테고리, 마지막에 **미분류**.
- **카테고리 목록의 맨 끝에 "+ 카테고리 추가" 버튼**을 둔다. (카테고리 칩과 같은 줄, 같은 높이)
- 줄이 넘치면 `flex-wrap`으로 다음 줄로 내린다. (가로 스크롤 사용하지 않음)
- 바와 카드 그리드 사이 간격 `mb-6`.

```tsx
<nav aria-label="카테고리" className="mb-6 flex flex-wrap items-center gap-2">
  {/* 선택된 칩 */}
  <button className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background">
    전체
  </button>

  {/* 기본 칩 */}
  <button className="rounded-full border border-black/[.08] px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.08]">
    모델
  </button>

  {/* 카테고리 추가 버튼 — 항상 목록의 마지막 */}
  <button className="rounded-full border border-dashed border-black/20 px-4 py-1.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/[.04] dark:border-white/25 dark:text-white/60 dark:hover:bg-white/[.08]">
    + 카테고리 추가
  </button>
</nav>
```

**칩 상태**

| 상태 | 스타일 |
| --- | --- |
| 기본 | 옅은 테두리, 투명 배경 |
| 호버 | 옅은 배경 `hover:bg-black/[.04]` |
| 선택됨 | `bg-foreground text-background` (테두리 없음), `aria-pressed="true"` |
| 포커스 | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground` |

**카테고리 추가 버튼 규칙**
- 점선 테두리(`border-dashed`)와 `+` 접두사로 일반 칩과 시각적으로 구분한다.
- 클릭하면 입력 UI가 나타난다: 버튼 자리가 작은 입력창(`rounded-full`, 같은 높이)으로 바뀌고 Enter로 저장, Esc로 취소. 모달은 쓰지 않는다.
- 빈 이름·중복 이름은 입력창 아래 `text-xs` 안내 문구로 알린다.

### 3.3 뉴스 카드 그리드
- `grid gap-4 sm:grid-cols-2` (모바일 1열, `sm` 이상 2열). 넓은 화면에서도 `max-w-5xl`로 폭을 제한해 줄 길이를 읽기 좋게 유지한다.
- 선택한 카테고리에 맞는 카드만 표시한다.

## 4. 뉴스 카드

구현: `src/components/article-card.tsx`

```
┌────────────────────────────────────┐
│ (카테고리 칩)        출처 · 날짜     │  ← 메타 줄 (text-xs)
│                                    │
│ 한글 제목 (text-lg, semibold)       │
│ English original title (text-xs)   │
│                                    │
│ 한글 요약 (text-sm, relaxed)        │
│                                    │
│ 원문 보기 →                         │  ← 항상 카드 하단 (mt-auto)
└────────────────────────────────────┘
```

- 컨테이너: `flex flex-col gap-3 rounded-2xl border border-black/[.08] p-5 dark:border-white/[.145]`
- 카테고리 칩: `rounded-full bg-black/[.05] px-2.5 py-1 text-xs font-medium dark:bg-white/[.1]`. 카테고리가 없으면 **미분류**.
- 한글 제목이 없으면 영문 제목을 제목 자리에 표시하고 원제 줄은 생략.
- 요약이 없으면 요약 영역을 생략.
- "원문 보기 →"는 새 탭(`target="_blank" rel="noopener noreferrer"`), `mt-auto`로 카드 높이가 달라도 하단에 정렬.
- 호버 시 카드 전체를 크게 변형하지 않는다. 필요하면 `transition-colors hover:border-black/20 dark:hover:border-white/30` 정도만.
- (예정) Notion 저장 버튼은 카드 하단 우측에 텍스트 버튼으로 추가. 저장 완료 후에는 "저장됨"으로 바뀌고 비활성화.

## 5. 상태 화면

| 상태 | 표현 |
| --- | --- |
| 로딩 | 가운데 정렬 `py-16 text-center text-black/50 dark:text-white/50` 문구 "기사를 불러오는 중..." |
| 빈 목록 | 같은 스타일, "아직 수집된 기사가 없습니다." |
| 카테고리 내 기사 없음 | 같은 스타일, "이 카테고리에 기사가 없습니다." |
| 오류 | 같은 위치에 `text-red-600 dark:text-red-400` 짧은 안내 + 다시 시도 링크 |

## 6. 반응형

- 기본은 모바일 우선(1열), `sm`(640px) 이상에서 2열.
- 컨테이너 좌우 패딩 `px-6` 고정.
- 카테고리 바는 줄바꿈으로 대응하므로 별도 모바일 레이아웃이 필요 없다.

## 7. 접근성

- 카테고리 바는 `<nav aria-label="카테고리">`, 칩은 `<button>`이며 선택 상태는 `aria-pressed`로 노출.
- 아이콘만 있는 버튼에는 `aria-label`을 붙인다. (현재는 텍스트 버튼 위주)
- 텍스트 대비: 보조 텍스트는 최소 `/50` 이상, 본문 요약은 `/70`을 유지한다.
- 키보드 포커스 표시(`focus-visible`)를 제거하지 않는다.

## 8. 구현 시 지침

- 새 UI는 별도 CSS 파일 없이 Tailwind 유틸리티로 작성한다. 반복되는 칩 스타일은 컴포넌트(`CategoryChip` 등)로 추출한다.
- 색을 새로 추가하지 말고 위 토큰(`foreground`/`background` + 투명도)을 조합한다.
- 컴포넌트 위치: `src/components/` (예: `category-bar.tsx`, `article-card.tsx`). 상호작용(선택·추가 입력)이 필요한 카테고리 바는 `"use client"` 컴포넌트로 만들고, 기사 조회는 서버 컴포넌트(`article-list.tsx`)에 둔다.
- Next.js API는 버전 차이가 있으므로 작성 전 `node_modules/next/dist/docs/`를 확인한다.
