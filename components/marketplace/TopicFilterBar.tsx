import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MarketplaceTopic } from "@/lib/marketplace-topics";

export function TopicFilterBar({
  topics,
  activeSlug,
}: {
  topics: MarketplaceTopic[];
  activeSlug?: string;
}) {
  if (!topics.length) return null;

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Topics
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/marketplace"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors border",
            !activeSlug
              ? "bg-primary text-white border-primary"
              : "bg-card text-primary border-border hover:border-primary/40"
          )}
        >
          All
        </Link>
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/marketplace?topic=${encodeURIComponent(topic.slug)}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors border",
              activeSlug === topic.slug
                ? "bg-primary text-white border-primary"
                : "bg-card text-primary border-border hover:border-primary/40"
            )}
          >
            {topic.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
