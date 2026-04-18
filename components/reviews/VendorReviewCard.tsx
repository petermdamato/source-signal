import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { Stars } from "./Stars";
import { RatingLabelWithTooltip } from "./RatingTooltip";
import { getFoundWhenLabel, getResultLabel } from "@/lib/review-options";
import { getReviewerDisplayName } from "@/lib/fetch-reviews-with-profiles";
import type { ReviewWithProfile } from "@/types/database";

type VendorReviewCardProps = {
  review: ReviewWithProfile;
  searchTerm?: string;
};

function HighlightText({ text, term }: { text: string; term: string }) {
  if (!term || !term.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term.trim())})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.trim().toLowerCase() ? (
          <mark key={i} className="rounded bg-[#d4a017]/40 px-0.5 text-[#2C4C5C]">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const RATING_LABELS = [
  { key: "rating", label: "Overall", tooltipKey: "rating" as const },
  { key: "ease_of_access_rating", label: "Accessibility", tooltipKey: "ease_of_access_rating" as const },
  { key: "sales_team_rating", label: "Sales Team", tooltipKey: "sales_team_rating" as const },
  { key: "data_coverage_rating", label: "Data Coverage", tooltipKey: "data_coverage_rating" as const },
  { key: "value_rating", label: "Value", tooltipKey: "value_rating" as const },
] as const;

export function VendorReviewCard({ review, searchTerm }: VendorReviewCardProps) {
  const val = (k: (typeof RATING_LABELS)[number]["key"]) =>
    (review as Record<string, unknown>)[k] as number | null | undefined;

  const displayName = getReviewerDisplayName(review);
  const company = review.companies;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-[#6C8494]">{displayName}</p>
            <h3 className="font-semibold text-[#2C4C5C]">{review.title}</h3>
          </div>
          {company && (
            <Link
              href={`/companies/${company.slug}`}
              className="shrink-0 text-sm text-[#6C8494] hover:text-[#2C4C5C] hover:underline transition-colors"
            >
              ← {company.name}
            </Link>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {RATING_LABELS.map(({ key, label, tooltipKey }) => {
            const r = val(key);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-[#6C8494]">
                  <RatingLabelWithTooltip label={`${label}:`} tooltipKey={tooltipKey} />
                </span>
                {r != null ? (
                  <Stars rating={r} size="sm" />
                ) : (
                  <span className="text-xs text-[#B8BFC1]">N/A</span>
                )}
              </div>
            );
          })}
        </div>

        {(review.found_when || review.result) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {review.found_when && (
              <span className="rounded-full bg-[#2C4C5C]/10 px-2 py-0.5 text-xs text-[#2C4C5C]">
                {getFoundWhenLabel(review.found_when)}
              </span>
            )}
            {review.result && (
              <span className="rounded-full bg-[#6C8494]/15 px-2 py-0.5 text-xs text-[#2C4C5C]">
                {getResultLabel(review.result)}
              </span>
            )}
          </div>
        )}

        {review.body && (
          <p className="mt-3 text-sm text-[#6C8494]">
            {searchTerm ? (
              <HighlightText text={review.body} term={searchTerm} />
            ) : (
              review.body
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
