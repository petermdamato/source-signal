import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { Stars } from "./Stars";
import { RatingLabelWithTooltip } from "./RatingTooltip";
import { getFoundWhenLabel, getResultLabel } from "@/lib/review-options";
import { getReviewerDisplayName } from "@/lib/fetch-reviews-with-profiles";
import type { ReviewWithProfile } from "@/types/database";

type ReviewCardProps = {
  review: ReviewWithProfile;
  companyName?: string;
  companySlug?: string;
};

const RATING_LABELS = [
  { key: "rating", label: "Overall", tooltipKey: "rating" as const },
  { key: "ease_of_access_rating", label: "Accessibility", tooltipKey: "ease_of_access_rating" as const },
  { key: "sales_team_rating", label: "Sales Team", tooltipKey: "sales_team_rating" as const },
  { key: "data_coverage_rating", label: "Data Coverage", tooltipKey: "data_coverage_rating" as const },
  { key: "value_rating", label: "Value", tooltipKey: "value_rating" as const },
] as const;

export function ReviewCard({
  review,
  companyName = review.companies?.name,
  companySlug = review.companies?.slug,
}: ReviewCardProps) {
  const displayName = getReviewerDisplayName(review);

  const val = (k: (typeof RATING_LABELS)[number]["key"]) =>
    (review as Record<string, unknown>)[k] as number | null | undefined;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{displayName}</p>
            <h3 className="font-semibold text-primary">{review.title}</h3>
          </div>
          {companyName && (
            <Link
              href={companySlug ? `/companies/${companySlug}` : "#"}
              className="shrink-0 text-sm text-primary transition-colors hover:underline"
            >
              ← {companyName}
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {RATING_LABELS.map(({ key, label, tooltipKey }) => {
            const r = val(key);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  <RatingLabelWithTooltip label={`${label}:`} tooltipKey={tooltipKey} />
                </span>
                {r != null ? (
                  <Stars rating={r} size="sm" />
                ) : (
                  <span className="text-xs text-muted-foreground/50">N/A</span>
                )}
              </div>
            );
          })}
        </div>
        {(review.found_when || review.result) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {review.found_when && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {getFoundWhenLabel(review.found_when)}
              </span>
            )}
            {review.result && (
              <span className="rounded-full bg-primary-mid/15 px-2 py-0.5 text-xs text-primary">
                {getResultLabel(review.result)}
              </span>
            )}
          </div>
        )}
        {review.body && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
        )}
      </CardContent>
    </Card>
  );
}
