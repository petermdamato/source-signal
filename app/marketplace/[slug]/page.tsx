import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { TopicBadges } from "@/components/marketplace/TopicBadges";
import { MarketplaceListingLogo } from "@/components/marketplace/MarketplaceListingLogo";
import {
  LISTING_TOPICS_SELECT,
  topicsFromListingJoin,
  type ListingTopicLink,
} from "@/lib/marketplace-topics";
import {
  isVendorSelfServeListing,
  listingAccessBadgeIsInstant,
  listingAccessBadgeLabel,
  listingAccessDescription,
} from "@/lib/marketplace-vendor-access";
import { VendorApiKeyPanel } from "@/components/marketplace/VendorApiKeyPanel";
import { VendorViewSwitch } from "@/components/vendor/VendorViewSwitch";
import { SubscribePanel } from "./SubscribePanel";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("marketplace_listings")
    .select("title, tagline")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return {
    title: data ? `${data.title} — Source Signal Marketplace` : "Listing not found",
    description: data?.tagline ?? undefined,
  };
}

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

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  type Plan = {
    id: string; name: string; price_cents: number; currency: string;
    interval: string | null; trial_days: number; quota: Record<string, unknown>; active: boolean;
  };
  type Company = { id: string; name: string; slug: string; logo_url: string | null; category: string | null; website_url: string | null };
  type ApiProduct = { id: string; name: string; base_url: string | null; docs_url: string | null; auth_type: string | null; connector_type: string | null };
  type ListingRow = {
    id: string; slug: string; title: string; tagline: string | null;
    description: string | null; fulfillment_mode: string;
    license_summary: string | null; license_version: string; updated_at: string;
    companies: Company | null;
    api_products: ApiProduct | null;
    marketplace_plans: Plan[];
    marketplace_listing_topics: ListingTopicLink[];
  };

  const { data: listingRaw } = await admin
    .from("marketplace_listings")
    .select(`
      id, slug, title, tagline, description, fulfillment_mode,
      license_summary, license_version, updated_at,
      companies(id, name, slug, logo_url, category, website_url),
      api_products(id, name, base_url, docs_url, auth_type, connector_type),
      marketplace_plans(id, name, price_cents, currency, interval, trial_days, quota, active),
      ${LISTING_TOPICS_SELECT}
    `)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  const listing = listingRaw as unknown as ListingRow | null;
  if (!listing) notFound();

  const company = listing.companies;
  const apiProduct = listing.api_products;
  const plans = listing.marketplace_plans.filter((p) => p.active);
  const topics = topicsFromListingJoin(listing.marketplace_listing_topics);

  // Load user's orgs for subscribe panel (unused for vendor self-serve listings)
  const selfServe = isVendorSelfServeListing(listing.slug);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userOrgs: { id: string; name: string }[] = [];
  if (user && !selfServe) {
    const { data: memberships } = await admin
      .from("org_members")
      .select("organizations(id, name)")
      .eq("user_id", user.id);
    userOrgs = (memberships ?? [])
      .map((m) => m.organizations as { id: string; name: string } | null)
      .filter((o): o is { id: string; name: string } => o != null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-primary">Marketplace</Link>
        <span className="mx-2">›</span>
        <span className="text-primary">{listing.title}</span>
      </nav>

      {company && (
        <div className="mb-6">
          <VendorViewSwitch
            companySlug={company.slug}
            listingSlug={listing.slug}
            active="marketplace"
          />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Left: listing info */}
        <div>
          {/* Company info */}
          {company && (
            <div className="mb-6 flex items-center gap-3">
              <MarketplaceListingLogo
                listingSlug={listing.slug}
                companyName={company.name}
                companyLogoUrl={company.logo_url}
                size="md"
              />
              <div>
                <Link href={`/companies/${company.slug}`} className="text-sm font-semibold text-primary hover:text-accent">
                  {company.name}
                </Link>
                {company.category && (
                  <p className="text-xs text-muted-foreground">{company.category}</p>
                )}
              </div>
            </div>
          )}

          <h1 className="font-display text-3xl font-bold text-primary">{listing.title}</h1>
          {listing.tagline && (
            <p className="mt-2 text-lg text-muted-foreground">{listing.tagline}</p>
          )}

          {topics.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Data topics
              </p>
              <TopicBadges topics={topics} linkable size="md" />
            </div>
          )}

          {listing.description && (
            <div className="mt-6 prose prose-sm max-w-none text-primary/80">
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* API product details */}
          {apiProduct && (
            <div className="mt-8">
              <h2 className="text-base font-semibold text-primary mb-3">API details</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Auth type</dt>
                <dd className="font-mono text-primary">{apiProduct.auth_type ?? "—"}</dd>
                <dt className="text-muted-foreground">Base URL</dt>
                <dd className="font-mono text-primary truncate">{apiProduct.base_url ?? "—"}</dd>
                {apiProduct.docs_url && (
                  <>
                    <dt className="text-muted-foreground">Documentation</dt>
                    <dd>
                      <a href={apiProduct.docs_url} target="_blank" rel="noopener noreferrer" className="text-accent underline truncate block">
                        View docs
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {slug === "census-data-api" && (
            <div className="mt-8 rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
              <h2 className="text-base font-semibold text-primary">Try the API</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Run live poverty and homeownership queries by city and year — no signup required for this demo.
              </p>
              <Link href="/marketplace/census-data-api/help" className="mt-4 inline-block">
                <Button variant="accent" size="sm">
                  See our Census Bureau API help page
                </Button>
              </Link>
            </div>
          )}

          {/* License */}
          {listing.license_summary && (
            <div className="mt-8 rounded-lg bg-primary/[0.04] p-4 text-sm">
              <p className="font-semibold text-primary mb-1">License terms (v{listing.license_version})</p>
              <p className="text-muted-foreground">{listing.license_summary}</p>
            </div>
          )}

          {/* Fulfillment mode badge */}
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                listingAccessBadgeIsInstant(listing.slug, listing.fulfillment_mode)
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {listingAccessBadgeLabel(listing.slug, listing.fulfillment_mode)}
            </span>
            <span className="text-muted-foreground">
              {listingAccessDescription(listing.slug, listing.fulfillment_mode)}
            </span>
          </div>
        </div>

        {/* Right: subscribe panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 sticky top-6">
            <h2 className="font-semibold text-primary mb-4">
              {selfServe ? "Get started" : "Choose a plan"}
            </h2>

            {selfServe ? (
              <VendorApiKeyPanel listingSlug={listing.slug} />
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Contact the vendor for pricing.</p>
            ) : (
              <SubscribePanel
                plans={plans.map((p) => ({
                  id: p.id,
                  name: p.name,
                  priceLabel: formatPrice(p.price_cents, p.currency, p.interval),
                  interval: p.interval,
                  trialDays: p.trial_days,
                  quota: p.quota,
                }))}
                listingSlug={listing.slug}
                fulfillmentMode={listing.fulfillment_mode}
                userOrgs={userOrgs}
                isLoggedIn={!!user}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
