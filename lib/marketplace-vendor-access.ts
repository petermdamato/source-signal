/** Listings where API keys come from the vendor, not Source Signal. */
export const VENDOR_SELF_SERVE_ACCESS: Record<
  string,
  {
    keyUrl: string;
    keyLabel: string;
    docsUrl: string;
    docsLabel?: string;
    tryUrl?: string;
    tryLabel?: string;
  }
> = {
  "census-data-api": {
    keyUrl: "https://api.census.gov/data/key_signup.html",
    keyLabel: "Get Census API key",
    docsUrl: "https://www.census.gov/data/developers.html",
    docsLabel: "Census developer docs",
    tryUrl: "/marketplace/census-data-api/help",
    tryLabel: "Try the API in your browser",
  },
  "wattbuy-api": {
    keyUrl: "https://wattbuy.readme.io/reference/creating-an-account",
    keyLabel: "Create WattBuy developer account",
    docsUrl: "https://wattbuy.readme.io/reference/getting-started-with-your-api",
    docsLabel: "WattBuy API reference",
  },
};

export function isVendorSelfServeListing(slug: string): boolean {
  return slug in VENDOR_SELF_SERVE_ACCESS;
}

export function getVendorSelfServeAccess(slug: string) {
  return VENDOR_SELF_SERVE_ACCESS[slug] ?? null;
}

/** Badge label on marketplace cards and listing pages. */
export function listingAccessBadgeLabel(
  listingSlug: string,
  fulfillmentMode: string
): string {
  if (
    isVendorSelfServeListing(listingSlug) ||
    fulfillmentMode === "platform"
  ) {
    return "Instant";
  }
  return "Vendor direct";
}

export function listingAccessBadgeIsInstant(
  listingSlug: string,
  fulfillmentMode: string
): boolean {
  return listingAccessBadgeLabel(listingSlug, fulfillmentMode) === "Instant";
}

export function listingAccessDescription(
  listingSlug: string,
  fulfillmentMode: string
): string {
  if (isVendorSelfServeListing(listingSlug)) {
    return "Free API access — get your key from the provider and call their API directly.";
  }
  if (fulfillmentMode === "platform") {
    return "Subscribe instantly. Access via Source Signal gateway.";
  }
  return "We connect you with the vendor to finalize access.";
}
