"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { ReviewWithProfile } from "@/types/database";
import { Stars } from "@/components/reviews/Stars";

type ReviewsCarouselProps = {
  reviews: ReviewWithProfile[];
};

export function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(reviews.length > 1);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
  }, [reviews.length]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  }

  if (reviews.length === 0) {
    return (
      <section aria-labelledby="reviews-carousel-heading">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <h2 id="reviews-carousel-heading" className="text-lg font-semibold text-primary">
            New reviews
          </h2>
          <p className="mt-2 text-sm">No reviews yet. Be the first to share your experience.</p>
          <Link href="/companies" className="mt-3 inline-block text-sm text-primary transition-colors hover:text-accent hover:underline">
            Browse vendors →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="reviews-carousel-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Community</p>
          <h2 id="reviews-carousel-heading" className="mt-1 text-xl font-semibold text-primary">
            New reviews
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous reviews"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/[0.04] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next reviews"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/[0.04] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "thin" }}
      >
        {reviews.map((review) => {
          const companySlug = review.companies?.slug;
          const companyName = review.companies?.name;
          const displayName =
            review.profiles?.display_name?.trim() ||
            review.profiles?.full_name?.trim() ||
            "Reviewer";

          return (
            <article
              key={review.id}
              className="w-[min(100%,22rem)] shrink-0 snap-start rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-2">
                {review.rating != null && <Stars rating={review.rating} size="sm" />}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{displayName}</p>
                  <h3 className="font-semibold text-primary line-clamp-2">{review.title}</h3>
                  {companySlug && companyName && (
                    <Link
                      href={`/companies/${companySlug}`}
                      className="mt-0.5 inline-block text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                    >
                      {companyName}
                    </Link>
                  )}
                </div>
                {review.body && (
                  <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
