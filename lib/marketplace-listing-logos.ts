/** Public-folder logos for marketplace listings (fallback when company.logo_url is unset). */
export const MARKETPLACE_LISTING_LOGOS: Record<string, string> = {
  "census-data-api": "/census_acs.png",
  "wattbuy-api": "/wattbuy.png",
};

export function marketplaceListingLogoUrl(
  listingSlug: string | null | undefined,
  companyLogoUrl?: string | null
): string | null {
  if (companyLogoUrl?.trim()) return companyLogoUrl;
  if (!listingSlug) return null;
  return MARKETPLACE_LISTING_LOGOS[listingSlug] ?? null;
}
