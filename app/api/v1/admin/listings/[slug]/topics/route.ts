import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonWithRequestId,
  unauthorizedJson,
  verifyAdminApiKey,
} from "@/lib/marketplace-api-auth";

type Body = {
  topic_slugs?: string[];
};

/**
 * PUT /api/v1/admin/listings/:slug/topics
 * Replace all topics on a listing. Admin only (MARKETPLACE_API_KEY).
 * Body: { "topic_slugs": ["population", "homeownership", "income-poverty"] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!verifyAdminApiKey(request)) return unauthorizedJson();

  const { slug } = await params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonWithRequestId({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topicSlugs = body.topic_slugs ?? [];
  const admin = createAdminClient();

  const { data: listingRaw } = await admin
    .from("marketplace_listings")
    .select("id, slug, title")
    .eq("slug", slug)
    .single();

  const listing = listingRaw as { id: string; slug: string; title: string } | null;
  if (!listing) {
    return jsonWithRequestId({ error: "Listing not found" }, { status: 404 });
  }

  if (topicSlugs.length === 0) {
    await admin.from("marketplace_listing_topics").delete().eq("listing_id", listing.id);
    return jsonWithRequestId({ listing_slug: slug, topics: [] });
  }

  const { data: topicsRaw, error: topicsError } = await admin
    .from("marketplace_topics")
    .select("id, slug, label")
    .in("slug", topicSlugs);

  if (topicsError) {
    return jsonWithRequestId({ error: topicsError.message }, { status: 500 });
  }

  const topics = (topicsRaw ?? []) as { id: string; slug: string; label: string }[];
  const foundSlugs = new Set(topics.map((t) => t.slug));
  const missing = topicSlugs.filter((s) => !foundSlugs.has(s));
  if (missing.length) {
    return jsonWithRequestId(
      { error: `Unknown topic slugs: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  await admin.from("marketplace_listing_topics").delete().eq("listing_id", listing.id);

  const { error: insertError } = await admin.from("marketplace_listing_topics").insert(
    topics.map((t) => ({ listing_id: listing.id, topic_id: t.id }))
  );

  if (insertError) {
    return jsonWithRequestId({ error: insertError.message }, { status: 500 });
  }

  return jsonWithRequestId({
    listing_slug: slug,
    topics: topics.map((t) => ({ slug: t.slug, label: t.label })),
  });
}
