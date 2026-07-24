import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanyMarketplaceListing = {
  slug: string;
  title: string;
};

/** Published marketplace listing for a company, if any. */
export async function fetchCompanyMarketplaceListing(
  supabase: SupabaseClient,
  companyId: string
): Promise<CompanyMarketplaceListing | null> {
  const { data } = await supabase
    .from("marketplace_listings")
    .select("slug, title")
    .eq("company_id", companyId)
    .eq("published", true)
    .maybeSingle();

  return data ?? null;
}
