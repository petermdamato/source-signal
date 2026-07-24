export function Stars({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const r = Math.round(clamped);
  const label = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1);
  return (
    <span
      role="img"
      className={`inline-flex gap-0.5 text-accent ${size === "sm" ? "text-base" : "text-lg"}`}
      aria-label={`${label} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= r ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
