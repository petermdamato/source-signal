import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTING_TOPICS_SELECT } from "@/lib/marketplace-topics";
import { jsonWithRequestId } from "@/lib/marketplace-api-auth";

// GET /api/v1/listings/:slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("marketplace_listings")
    .select(`
      id, slug, title, tagline, description, fulfillment_mode, license_summary, license_version, updated_at,
      companies!inner(id, name, slug, logo_url, category, website_url, is_active),
      api_products(id, name, base_url, docs_url, auth_type, connector_type),
      marketplace_plans(id, name, price_cents, currency, interval, trial_days, quota, stripe_price_id, active),
      ${LISTING_TOPICS_SELECT}
    `)
    .eq("slug", slug)
    .eq("published", true)
    .eq("companies.is_active", true)
    .single();

  if (error || !data) return jsonWithRequestId({ error: "Listing not found" }, { status: 404 });

  return jsonWithRequestId({ listing: data });
}
