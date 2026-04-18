import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMarketplaceApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

type Body = {
  companyId?: string;
  companySlug?: string;
  name: string;
  baseUrl?: string | null;
  docsUrl?: string | null;
  authType?: string | null;
};

export async function POST(request: Request) {
  if (!verifyMarketplaceApiKey(request)) {
    return unauthorizedJson();
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonWithRequestId(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonWithRequestId({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return jsonWithRequestId({ error: "name is required" }, { status: 400 });
  }

  let companyId = body.companyId ?? null;
  if (!companyId && body.companySlug?.trim()) {
    const { data: c } = await admin.from("companies").select("id").eq("slug", body.companySlug.trim()).maybeSingle();
    companyId = c?.id ?? null;
  }

  if (!companyId) {
    return jsonWithRequestId(
      { error: "Provide companyId or companySlug" },
      { status: 400 }
    );
  }

  const { data: row, error } = await admin
    .from("api_products")
    .insert({
      company_id: companyId,
      name: body.name.trim(),
      base_url: body.baseUrl?.trim() || null,
      docs_url: body.docsUrl?.trim() || null,
      auth_type: body.authType?.trim() || null,
    })
    .select("id, company_id, name, base_url, docs_url, auth_type, created_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: error.message }, { status: 500 });
  }

  return jsonWithRequestId({ apiProduct: row }, { status: 201 });
}
