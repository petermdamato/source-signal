"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBookmark } from "@/app/actions/bookmarks";

type BookmarkButtonProps = {
  companyId: string;
  companySlug: string;
  isBookmarked: boolean;
  variant?: "icon" | "button";
};

export function BookmarkButton({
  companyId,
  companySlug,
  isBookmarked,
  variant = "icon",
}: BookmarkButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await toggleBookmark(companyId, companySlug);
      if (result?.error) {
        router.push(`/login?next=/companies/${companySlug}`);
      } else {
        router.refresh();
      }
    });
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#6C8494]/30 bg-white px-3 py-2 text-sm font-medium text-[#2C4C5C] transition-colors hover:bg-[#B8BFC1]/25 disabled:opacity-50"
      >
        {isBookmarked ? (
          <>
            <span aria-hidden className="text-[#d4a017]">★</span>
            Saved
          </>
        ) : (
          <>
            <span aria-hidden className="text-[#B8BFC1]">☆</span>
            Save
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="cursor-pointer rounded p-1.5 text-lg transition-colors hover:bg-[#B8BFC1]/30 disabled:opacity-50"
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark company"}
      title={isBookmarked ? "Remove bookmark" : "Bookmark company"}
    >
      {isBookmarked ? (
        <span className="text-[#d4a017]" aria-hidden>★</span>
      ) : (
        <span className="text-[#B8BFC1]" aria-hidden>☆</span>
      )}
    </button>
  );
}
