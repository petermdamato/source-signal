export type MarketplaceTopic = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sort_order: number;
};

export type ListingTopicLink = {
  marketplace_topics: MarketplaceTopic | null;
};

/** Flatten Supabase nested join to topic array */
export function topicsFromListingJoin(
  links: ListingTopicLink[] | null | undefined
): MarketplaceTopic[] {
  if (!links?.length) return [];
  return links
    .map((l) => l.marketplace_topics)
    .filter((t): t is MarketplaceTopic => t != null)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export const LISTING_TOPICS_SELECT = `
  marketplace_listing_topics(
    marketplace_topics(id, slug, label, description, sort_order)
  )
`;
