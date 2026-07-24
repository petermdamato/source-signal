import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonWithRequestId, unauthorizedJson, verifyOrgApiKey } from "@/lib/marketplace-api-auth";

// GET /api/v1/entitlements — list entitlements for an org
// Accepts either session cookie (web) or org API key (machine)
export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  let organizationId: string | null = null;

  // Try org API key first
  const orgCtx = await verifyOrgApiKey(request);
  if (orgCtx) {
    organizationId = orgCtx.organizationId;
  } else {
    // Fall back to session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedJson("Sign in or provide an API key");

    const orgId = new URL(request.url).searchParams.get("organization_id");
    if (!orgId) return jsonWithRequestId({ error: "organization_id required" }, { status: 400 });

    const { data: membership } = await admin
      .from("org_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (!membership) return unauthorizedJson("Not a member of this organization");
    organizationId = orgId;
  }

  const { data: entitlements } = await admin
    .from("entitlements")
    .select(`
      id, status, license_accepted_at, license_version, expires_at, created_at,
      marketplace_listings(id, slug, title, fulfillment_mode)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return jsonWithRequestId({ entitlements: entitlements ?? [] });
}
