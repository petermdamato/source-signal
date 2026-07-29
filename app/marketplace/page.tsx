import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { buttonStyles } from "@/components/ui";
import { TopicBadges } from "@/components/marketplace/TopicBadges";
import { TopicFilterBar } from "@/components/marketplace/TopicFilterBar";
import { MarketplaceListingLogo } from "@/components/marketplace/MarketplaceListingLogo";
import {
  listingAccessBadgeIsInstant,
  listingAccessBadgeLabel,
} from "@/lib/marketplace-vendor-access";
import {
  LISTING_TOPICS_SELECT,
  topicsFromListingJoin,
  type ListingTopicLink,
  type MarketplaceTopic,
} from "@/lib/marketplace-topics";

export const metadata = {
  title: "Marketplace — Source Signal",
  description: "Subscribe to data APIs and datasets from trusted vendors.",
};

function formatPrice(priceCents: number, currency: string, interval: string | null) {
  if (priceCents === 0) return "Free";
  const amount = (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  });
  if (interval === "month") return `${amount}/mo`;
  if (interval === "year") return `${amount}/yr`;
  if (interval === "one_time") return `${amount} one-time`;
  if (interval === "usage") return `${amount}/unit`;
  return amount;
}

type Plan = { id: string; name: string; price_cents: number; currency: string; interval: string | null; active: boolean };
type Company = { id: string; name: string; slug: string; logo_url: string | null; category: string | null };
type Listing = {
  id: string; slug: string; title: string; tagline: string | null;
  fulfillment_mode: string; updated_at: string;
  companies: Company | null;
  marketplace_plans: Plan[];
  marketplace_listing_topics: ListingTopicLink[];
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: topicSlug } = await searchParams;
  const admin = createAdminClient();

  const [{ data: allTopicsRaw }, listingsResult] = await Promise.all([
    admin
      .from("marketplace_topics")
      .select("id, slug, label, description, sort_order")
      .order("sort_order", { ascending: true }),
    (async () => {
      let listingIds: string[] | null = null;
      if (topicSlug) {
        const { data: topicRaw } = await admin
          .from("marketplace_topics")
          .select("id")
          .eq("slug", topicSlug)
          .single();
        const topic = topicRaw as { id: string } | null;
        if (topic) {
          const { data: links } = await admin
            .from("marketplace_listing_topics")
            .select("listing_id")
            .eq("topic_id", topic.id);
          listingIds = (links ?? []).map((l) => (l as { listing_id: string }).listing_id);
        } else {
          listingIds = [];
        }
      }

      let query = admin
        .from("marketplace_listings")
        .select(`
          id, slug, title, tagline, fulfillment_mode, updated_at,
          companies!inner(id, name, slug, logo_url, category, is_active),
          marketplace_plans(id, name, price_cents, currency, interval, active),
          ${LISTING_TOPICS_SELECT}
        `)
        .eq("published", true)
        .eq("companies.is_active", true)
        .order("updated_at", { ascending: false });

      if (listingIds !== null) {
        if (listingIds.length === 0) {
          return { data: [] };
        }
        query = query.in("id", listingIds);
      }

      return query;
    })(),
  ]);

  const filterTopics = (allTopicsRaw ?? []) as MarketplaceTopic[];
  const rows = (listingsResult.data ?? []) as unknown as Listing[];
  const activeTopic = topicSlug
    ? filterTopics.find((t) => t.slug === topicSlug)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Data marketplace
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-primary">
            Subscribe to data APIs
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Browse curated API products from vetted data vendors. Subscribe instantly or connect with vendors directly.
          </p>
          {activeTopic && (
            <p className="mt-2 text-sm text-primary">
              Filtered by <strong>{activeTopic.label}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/marketplace/sell" className={buttonStyles("outline", "sm")}>
            Sell your data
          </Link>
          <Link href="/dashboard-protected-routes/developers" className={buttonStyles("primary", "sm")}>
            My API keys
          </Link>
        </div>
      </div>

      <TopicFilterBar topics={filterTopics} activeSlug={topicSlug} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-primary font-semibold text-lg">
            {topicSlug ? "No listings for this topic yet" : "Marketplace coming soon"}
          </p>
          <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
            {topicSlug
              ? "Try another topic or browse all listings."
              : "We are onboarding our first data providers. Want to be first?"}
          </p>
          {topicSlug ? (
            <Link href="/marketplace" className={buttonStyles("outline", "md", "mt-6")}>
              View all listings
            </Link>
          ) : (
            <Link href="/marketplace/sell" className={buttonStyles("accent", "md", "mt-6")}>
              Sell your data with us
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((listing) => {
            const company = listing.companies;
            const topics = topicsFromListingJoin(listing.marketplace_listing_topics);
            const activePlans = listing.marketplace_plans.filter((p) => p.active);
            const lowestPlan = [...activePlans].sort((a, b) => a.price_cents - b.price_cents)[0];

            return (
              <article
                key={listing.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
              >
                <Link
                  href={`/marketplace/${listing.slug}`}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <MarketplaceListingLogo
                      listingSlug={listing.slug}
                      companyName={company?.name}
                      companyLogoUrl={company?.logo_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{company?.name}</p>
                    </div>
                  </div>

                  <h2 className="text-base font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">
                    {listing.title}
                  </h2>
                  {listing.tagline && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{listing.tagline}</p>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div>
                      {lowestPlan ? (
                        <span className="text-sm font-semibold text-primary">
                          {formatPrice(lowestPlan.price_cents, lowestPlan.currency, lowestPlan.interval)}
                          {activePlans.length > 1 && (
                            <span className="ml-1 text-xs text-muted-foreground font-normal">and up</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact for pricing</span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        listingAccessBadgeIsInstant(listing.slug, listing.fulfillment_mode)
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {listingAccessBadgeLabel(listing.slug, listing.fulfillment_mode)}
                    </span>
                  </div>
                </Link>

                {topics.length > 0 && (
                  <TopicBadges topics={topics} linkable className="mt-3" />
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-16 rounded-xl border border-border bg-card px-8 py-10 text-center">
        <h2 className="font-display text-2xl font-bold text-primary">Sell your data with Source Signal</h2>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Reach data buyers and AI agents. Get your API listed in the marketplace and start monetizing your data.
        </p>
        <Link href="/marketplace/sell" className={buttonStyles("accent", "lg", "mt-6")}>
          Get started
        </Link>
      </div>
    </div>
  );
}
