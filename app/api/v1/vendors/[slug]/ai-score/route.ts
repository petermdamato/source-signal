import { createClient } from "@/lib/supabase/server";
import { activeCompaniesFilter } from "@/lib/companies-active";
import { verifyMarketplaceApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

type Props = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Props) {
  if (!verifyMarketplaceApiKey(request)) {
    return unauthorizedJson();
  }

  const { slug } = await params;
  const supabase = await createClient();

  const { data: company, error: cErr } = await activeCompaniesFilter(
    supabase.from("companies").select("id, name, slug").eq("slug", slug)
  ).maybeSingle();

  if (cErr) {
    return jsonWithRequestId({ error: cErr.message }, { status: 500 });
  }
  if (!company) {
    return jsonWithRequestId({ error: "Vendor not found" }, { status: 404 });
  }

  const { data: latest, error: sErr } = await supabase
    .from("ai_connectivity_scores")
    .select("score, methodology_version, computed_at, api_product_id")
    .eq("company_id", company.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sErr) {
    return jsonWithRequestId({ error: sErr.message }, { status: 500 });
  }

  return jsonWithRequestId({
    vendor: { id: company.id, name: company.name, slug: company.slug },
    latestScore: latest,
  });
}
