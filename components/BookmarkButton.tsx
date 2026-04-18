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
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/[0.04] disabled:opacity-50"
      >
        {isBookmarked ? (
          <>
            <span aria-hidden className="text-accent">★</span>
            Saved
          </>
        ) : (
          <>
            <span aria-hidden className="text-muted-foreground/70">☆</span>
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
      className="cursor-pointer rounded p-1.5 text-lg transition-colors hover:bg-primary/[0.06] disabled:opacity-50"
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark company"}
      title={isBookmarked ? "Remove bookmark" : "Bookmark company"}
    >
      {isBookmarked ? (
        <span className="text-accent" aria-hidden>★</span>
      ) : (
        <span className="text-muted-foreground/70" aria-hidden>☆</span>
      )}
    </button>
  );
}
