import Link from "next/link";
import type { Category } from "@/db/schema";

type CategoryBarProps = {
  categories: Category[];
  /** 선택된 카테고리 id. null이면 '전체' */
  selectedId: number | null;
};

const chipBase =
  "rounded-full px-4 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const chipIdle =
  "border border-black/[.08] transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.08]";
const chipSelected = "bg-foreground text-background";

/** 뉴스 카드 목록 위의 카테고리 바. 맨 끝에 '카테고리 추가' 버튼이 온다. (ui.md §3.2) */
export function CategoryBar({ categories, selectedId }: CategoryBarProps) {
  // 전체 → 사용자 카테고리 → 미분류 순
  const sorted = [
    ...categories.filter((c) => !c.isUncategorized),
    ...categories.filter((c) => c.isUncategorized),
  ];

  return (
    <nav aria-label="카테고리" className="mb-6 flex flex-wrap items-center gap-2">
      <Link
        href="/dashboard"
        aria-current={selectedId === null ? "page" : undefined}
        className={`${chipBase} ${selectedId === null ? chipSelected : chipIdle}`}
      >
        전체
      </Link>

      {sorted.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Link
            key={category.id}
            href={`/dashboard?category=${category.id}`}
            aria-current={selected ? "page" : undefined}
            className={`${chipBase} ${selected ? chipSelected : chipIdle}`}
          >
            {category.name}
          </Link>
        );
      })}

      {/* TODO: 클릭 시 입력창으로 전환하고 Enter로 저장 (카테고리 추가 기능 구현 단계에서 연결) */}
      <button
        type="button"
        disabled
        title="준비 중"
        className={`${chipBase} cursor-not-allowed border border-dashed border-black/20 text-black/60 dark:border-white/25 dark:text-white/60`}
      >
        + 카테고리 추가
      </button>
    </nav>
  );
}
