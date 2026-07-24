import { cn } from "@/lib/utils";
import Link from "next/link";
import type { MarketplaceTopic } from "@/lib/marketplace-topics";

export function TopicBadges({
  topics,
  size = "sm",
  linkable = false,
  className,
}: {
  topics: MarketplaceTopic[];
  size?: "sm" | "md";
  linkable?: boolean;
  className?: string;
}) {
  if (!topics.length) return null;

  const sizeClass =
    size === "md"
      ? "px-2.5 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {topics.map((topic) => {
        const badge = (
          <span
            className={cn(
              "inline-block rounded-full font-semibold uppercase tracking-wide",
              "bg-primary/10 text-primary border border-primary/15",
              sizeClass
            )}
          >
            {topic.label}
          </span>
        );

        return (
          <li key={topic.slug}>
            {linkable ? (
              <Link
                href={`/marketplace?topic=${encodeURIComponent(topic.slug)}`}
                className="hover:opacity-80 transition-opacity"
              >
                {badge}
              </Link>
            ) : (
              badge
            )}
          </li>
        );
      })}
    </ul>
  );
}
