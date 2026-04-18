import { createClient } from "@/lib/supabase/server";
import { verifyMarketplaceApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

export async function GET(request: Request) {
  if (!verifyMarketplaceApiKey(request)) {
    return unauthorizedJson();
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, name, slug, description, category, subcategory")
    .order("name")
    .limit(limit);

  if (q) {
    const term = `%${q}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    return jsonWithRequestId({ error: error.message }, { status: 500 });
  }

  return jsonWithRequestId({ vendors: data ?? [] });
}
