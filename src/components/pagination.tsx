import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** 페이지 번호를 받아 이동할 href를 만든다. */
  hrefFor: (page: number) => string;
};

/** 현재 페이지 앞뒤로 보여줄 번호 개수 */
const SIBLINGS = 2;

const base =
  "rounded-full px-4 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const idle =
  "border border-black/[.08] transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.08]";
const selected = "bg-foreground text-background";
const disabled =
  "cursor-not-allowed border border-black/[.08] opacity-40 dark:border-white/[.145]";

type Item = number | "ellipsis-start" | "ellipsis-end";

/**
 * 표시할 항목 목록을 만든다.
 * 예) 100페이지 중 50페이지 → 1 … 48 49 50 51 52 … 100
 * - 첫/마지막 페이지는 항상 표시
 * - 현재 페이지 기준 앞뒤 2개씩 표시
 * - 주변 번호가 첫/마지막 페이지와 이어지면 해당 쪽 '…'는 생략
 */
export function getPageItems(page: number, totalPages: number): Item[] {
  const from = Math.max(2, page - SIBLINGS);
  const to = Math.min(totalPages - 1, page + SIBLINGS);

  const items: Item[] = [1];
  if (from > 2) items.push("ellipsis-start");
  for (let n = from; n <= to; n++) items.push(n);
  if (to < totalPages - 1) items.push("ellipsis-end");
  if (totalPages > 1) items.push(totalPages);
  return items;
}

/** 뉴스 카드 목록 아래의 페이지 이동 바. 페이지가 1개뿐이면 렌더링하지 않는다. */
export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav
      aria-label="페이지"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <NavButton label="처음" href={isFirst ? null : hrefFor(1)} />
      <NavButton label="이전" href={isFirst ? null : hrefFor(page - 1)} />

      {getPageItems(page, totalPages).map((item) =>
        typeof item === "number" ? (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${item === page ? selected : idle}`}
          >
            {item}
          </Link>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="px-1 text-sm text-black/50 dark:text-white/50"
          >
            …
          </span>
        ),
      )}

      <NavButton label="다음" href={isLast ? null : hrefFor(page + 1)} />
      <NavButton label="끝" href={isLast ? null : hrefFor(totalPages)} />
    </nav>
  );
}

/** href가 null이면 비활성화된 버튼으로 그린다. */
function NavButton({ label, href }: { label: string; href: string | null }) {
  if (href === null) {
    return (
      <span aria-disabled="true" className={`${base} ${disabled}`}>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className={`${base} ${idle}`}>
      {label}
    </Link>
  );
}
