"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui";
import { Stars } from "./Stars";
import { VendorReviewCard } from "./VendorReviewCard";
import { RatingLabelWithTooltip } from "./RatingTooltip";
import type { Review, ReviewWithProfile } from "@/types/database";
import type { Company } from "@/types/database";

type VendorReviewsSectionProps = {
  company: Company;
  reviews: ReviewWithProfile[];
};

function safeAvg(reviews: ReviewWithProfile[], key: keyof Review): number {
  const vals = reviews
    .map((r) => (r as Record<string, unknown>)[key] as number | null | undefined)
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

export function VendorReviewsSection({ company, reviews }: VendorReviewsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReviews = useMemo(() => {
    if (!searchTerm.trim()) return reviews;
    const t = searchTerm.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        r.title.toLowerCase().includes(t) ||
        (r.body?.toLowerCase().includes(t) ?? false) ||
        r.found_when?.toLowerCase().includes(t) ||
        r.result?.toLowerCase().includes(t)
    );
  }, [reviews, searchTerm]);

  const avgRating = safeAvg(reviews, "rating");
  const avgAccessibility = safeAvg(reviews, "ease_of_access_rating");
  const avgSalesTeam = safeAvg(reviews, "sales_team_rating");
  const avgDataCoverage = safeAvg(reviews, "data_coverage_rating");
  const avgValue = safeAvg(reviews, "value_rating");

  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      if (r.rating == null) continue;
      const v = Math.round(r.rating);
      if (v >= 1 && v <= 5) counts[v as keyof typeof counts]++;
    }
    return counts;
  }, [reviews]);

  const totalForDistribution = Object.values(distribution).reduce((a, b) => a + b, 0);

  if (reviews.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-primary">Reviews</h2>
        <div className="mt-4 rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <p className="font-medium">No reviews yet</p>
          <p className="mt-1 text-sm">Be the first to review this vendor.</p>
          <Link
            href={`/companies/${company.slug}/review`}
            className="mt-4 inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            Write a review →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-primary">Reviews</h2>

      <div className="mt-6 grid gap-6 rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { avg: avgRating, label: "Overall", key: "rating" as const },
            { avg: avgAccessibility, label: "Accessibility", key: "ease_of_access_rating" as const },
            { avg: avgSalesTeam, label: "Sales Team", key: "sales_team_rating" as const },
            { avg: avgDataCoverage, label: "Data Coverage", key: "data_coverage_rating" as const },
            { avg: avgValue, label: "Value", key: "value_rating" as const },
          ].map(({ avg, label, key }, i) => (
            <div key={key}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <RatingLabelWithTooltip label={label} tooltipKey={key} />
              </p>
              <Stars rating={avg} />
              {i === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium text-primary">Rating distribution</p>
          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = distribution[stars];
              const pct = totalForDistribution ? (count / totalForDistribution) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-16 text-muted-foreground">{stars} star</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-mid/25">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
        >
          {expanded ? "Hide reviews" : "Show all reviews"}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="max-w-md">
              <label htmlFor="review-search" className="sr-only">Search reviews</label>
              <Input
                id="review-search"
                type="search"
                placeholder="Search in reviews…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search reviews"
              />
            </div>

            {filteredReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reviews match &quot;{searchTerm}&quot;.
              </p>
            ) : (
              <ul className="space-y-4">
                {filteredReviews.map((review) => (
                  <li key={review.id}>
                    <VendorReviewCard
                      review={{ ...review, companies: { name: company.name, slug: company.slug } }}
                      searchTerm={searchTerm.trim() || undefined}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
