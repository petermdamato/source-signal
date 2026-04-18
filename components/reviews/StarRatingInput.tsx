"use client";

import { useState } from "react";

type StarRatingInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel?: string;
};

export function StarRatingInput({
  value,
  onChange,
  ariaLabel = "Rating",
}: StarRatingInputProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isNA = value === null;
  const starValue = value ?? 5;
  const highlightCount = hoverIndex ?? starValue;

  return (
    <div
      className="flex items-center gap-2"
      onMouseLeave={() => setHoverIndex(null)}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          const isHighlighted = i <= highlightCount;
          const isCommitted = hasInteracted && !isNA && i <= starValue;

          let opacity = 0.6;
          if (hoverIndex !== null) {
            opacity = isHighlighted ? 0.8 : 0.6;
          } else if (isNA) {
            opacity = 0.6;
          } else {
            opacity = isCommitted ? 1 : 0.6;
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setHasInteracted(true);
                onChange(i);
              }}
              onMouseEnter={() => setHoverIndex(i)}
              className="rounded text-accent transition-opacity duration-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              style={{ opacity }}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              aria-pressed={!isNA && i <= starValue}
            >
              ★
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          setHasInteracted(true);
          onChange(null);
        }}
        className={`text-sm px-2 py-1 rounded transition-colors ${
          isNA
            ? "bg-primary-mid/25 text-primary font-medium"
            : "text-muted-foreground hover:bg-primary-mid/12"
        }`}
        aria-label="Not applicable"
        aria-pressed={isNA}
      >
        N/A
      </button>
    </div>
  );
}
