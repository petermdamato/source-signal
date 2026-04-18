export const RATING_TOOLTIPS: Record<string, string> = {
  rating:
    "This is a user rating, not an average of ratings.",
  ease_of_access_rating:
    "How easy did the company make it to access, ingest and utilize the firm's data?",
  sales_team_rating:
    "How easy was dealing with the sales team and getting queries answered?",
  data_coverage_rating:
    "Completeness of data as it relates to user's needs",
  value_rating:
    "How much value does the data bring in relation to its cost",
};

export function RatingLabelWithTooltip({
  label,
  tooltipKey,
}: {
  label: string;
  tooltipKey: keyof typeof RATING_TOOLTIPS;
}) {
  const tooltip = RATING_TOOLTIPS[tooltipKey];
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {tooltip && (
        <span
          className="group/tip relative inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-mid/25 text-[10px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label={tooltip}
        >
          ?
          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg bg-primary px-2.5 py-2 text-xs font-normal text-primary-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100">
            {tooltip}
          </span>
        </span>
      )}
    </span>
  );
}
