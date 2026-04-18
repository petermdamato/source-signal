export function Stars({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const r = Math.round(Math.max(0, Math.min(5, rating)));
  return (
    <span
      className={`inline-flex gap-0.5 text-[#d4a017] ${size === "sm" ? "text-base" : "text-lg"}`}
      aria-label={`${r} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= r ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
