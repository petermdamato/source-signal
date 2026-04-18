import { createClient } from "@/lib/supabase/server";
import { verifyMarketplaceApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";
import { computeReviewAggregates } from "@/lib/review-aggregates";

type Props = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Props) {
  if (!verifyMarketplaceApiKey(request)) {
    return unauthorizedJson();
  }

  const { slug } = await params;
  const supabase = await createClient();

  const { data: company, error: cErr } = await supabase
    .from("companies")
    .select(
      "id, name, slug, description, logo_url, website_url, category, subcategory, claimed, delivery_method_ids, data_attribute_ids, created_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (cErr) {
    return jsonWithRequestId({ error: cErr.message }, { status: 500 });
  }
  if (!company) {
    return jsonWithRequestId({ error: "Vendor not found" }, { status: 404 });
  }

  const { data: reviews, error: rErr } = await supabase
    .from("reviews")
    .select("hidden, rating, ease_of_access_rating, sales_team_rating, data_coverage_rating, value_rating")
    .eq("company_id", company.id);

  if (rErr) {
    return jsonWithRequestId({ error: rErr.message }, { status: 500 });
  }

  const aggregates = computeReviewAggregates(reviews ?? []);

  const { data: latestScore } = await supabase
    .from("ai_connectivity_scores")
    .select("score, methodology_version, computed_at, api_product_id")
    .eq("company_id", company.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return jsonWithRequestId({
    vendor: company,
    reviewAggregates: aggregates,
    aiConnectivityScore: latestScore ?? null,
  });
}
