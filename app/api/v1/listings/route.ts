import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTING_TOPICS_SELECT } from "@/lib/marketplace-topics";
import { jsonWithRequestId } from "@/lib/marketplace-api-auth";

// GET /api/v1/listings — public catalog of marketplace listings
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const fulfillmentMode = url.searchParams.get("fulfillment_mode");
  const topicSlug = url.searchParams.get("topic")?.trim();

  const admin = createAdminClient();

  let listingIds: string[] | null = null;
  if (topicSlug) {
    const { data: topicRaw } = await admin
      .from("marketplace_topics")
      .select("id")
      .eq("slug", topicSlug)
      .single();
    const topic = topicRaw as { id: string } | null;
    if (!topic) {
      return jsonWithRequestId({ listings: [], limit, offset, topic: topicSlug });
    }
    const { data: links } = await admin
      .from("marketplace_listing_topics")
      .select("listing_id")
      .eq("topic_id", topic.id);
    listingIds = (links ?? []).map((l) => (l as { listing_id: string }).listing_id);
    if (listingIds.length === 0) {
      return jsonWithRequestId({ listings: [], limit, offset, topic: topicSlug });
    }
  }

  let query = admin
    .from("marketplace_listings")
    .select(`
      id, slug, title, tagline, fulfillment_mode, license_summary, license_version, updated_at,
      companies(id, name, slug, logo_url, category),
      marketplace_plans(id, name, price_cents, currency, interval, trial_days, quota, active),
      ${LISTING_TOPICS_SELECT}
    `)
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (fulfillmentMode === "platform" || fulfillmentMode === "vendor_direct") {
    query = query.eq("fulfillment_mode", fulfillmentMode);
  }
  if (listingIds) {
    query = query.in("id", listingIds);
  }

  const { data, error } = await query;
  if (error) return jsonWithRequestId({ error: error.message }, { status: 500 });

  return jsonWithRequestId({
    listings: data ?? [],
    limit,
    offset,
    ...(topicSlug ? { topic: topicSlug } : {}),
  });
}
