"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import type { Review } from "@/types/database";

type ReviewWithCompany = Review & {
  companies: { name: string; slug: string } | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-[#d4a017]" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

type ReviewsCarouselProps = {
  reviews: ReviewWithCompany[];
};

export function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -(el.clientWidth * 0.85) : el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-[#6C8494]/25 bg-[var(--card)] p-8 text-center text-[#6C8494]">
        <p className="font-medium">No reviews yet</p>
        <p className="mt-1 text-sm">Be the first to leave a review.</p>
        <Link href="/companies" className="mt-3 inline-block text-sm text-[#6C8494] hover:text-[#2C4C5C] hover:underline transition-colors">
          Browse vendors →
        </Link>
      </div>
    );
  }

  return (
    <section className="relative" aria-label="New reviews">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[#2C4C5C]">New reviews</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous reviews"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#6C8494]/30 bg-white text-[#6C8494] transition-colors hover:bg-[#B8BFC1]/30 hover:text-[#2C4C5C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next reviews"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#6C8494]/30 bg-white text-[#6C8494] transition-colors hover:bg-[#B8BFC1]/30 hover:text-[#2C4C5C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {reviews.map((review) => (
          <div key={review.id} className="w-[min(100%,320px)] shrink-0 snap-start">
            <Card className="h-full">
              <CardContent className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#2C4C5C] line-clamp-2">{review.title}</h3>
                    {review.companies && (
                      <Link
                        href={`/companies/${review.companies.slug}`}
                        className="mt-0.5 inline-block text-sm text-[#6C8494] hover:text-[#2C4C5C] hover:underline transition-colors"
                      >
                        {review.companies.name}
                      </Link>
                    )}
                  </div>
                  {review.rating != null && <Stars rating={review.rating} />}
                </div>
                {review.body && (
                  <p className="mt-2 flex-1 text-sm text-[#6C8494] line-clamp-3">{review.body}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
