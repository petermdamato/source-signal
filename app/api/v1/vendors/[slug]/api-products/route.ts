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
    supabase.from("companies").select("id").eq("slug", slug)
  ).maybeSingle();

  if (cErr) {
    return jsonWithRequestId({ error: cErr.message }, { status: 500 });
  }
  if (!company) {
    return jsonWithRequestId({ error: "Vendor not found" }, { status: 404 });
  }

  const { data: products, error: pErr } = await supabase
    .from("api_products")
    .select("id, name, base_url, docs_url, auth_type, created_at, updated_at")
    .eq("company_id", company.id)
    .order("name");

  if (pErr) {
    return jsonWithRequestId({ error: pErr.message }, { status: 500 });
  }

  return jsonWithRequestId({ vendorSlug: slug, apiProducts: products ?? [] });
}
