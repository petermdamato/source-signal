import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateOrgApiKey,
  jsonWithRequestId,
  unauthorizedJson,
} from "@/lib/marketplace-api-auth";

const ALLOWED_SCOPES = ["catalog:read", "data:read", "subscribe"];

// POST /api/v1/api-keys — create an API key for one of the user's orgs
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson("Sign in required");

  let body: { organization_id?: string; name?: string; scopes?: string[] } = {};
  try { body = await request.json(); } catch { /* ok */ }

  const { organization_id, name, scopes = ["catalog:read"] } = body;
  if (!organization_id) return jsonWithRequestId({ error: "organization_id required" }, { status: 400 });
  if (!name?.trim()) return jsonWithRequestId({ error: "name required" }, { status: 400 });

  const invalidScopes = scopes.filter((s) => !ALLOWED_SCOPES.includes(s));
  if (invalidScopes.length) {
    return jsonWithRequestId({ error: `Invalid scopes: ${invalidScopes.join(", ")}. Allowed: ${ALLOWED_SCOPES.join(", ")}` }, { status: 400 });
  }

  const admin = createAdminClient();
  // Verify user is a member of this org
  const { data: membership } = await admin
    .from("org_members")
    .select("role")
    .eq("organization_id", organization_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return unauthorizedJson("Not a member of this organization");
  if (membership.role === "billing") return jsonWithRequestId({ error: "Billing role cannot create API keys" }, { status: 403 });

  const generated = generateOrgApiKey(true);
  const { data: row, error } = await admin
    .from("org_api_keys")
    .insert({
      organization_id,
      name: name.trim(),
      key_prefix: generated.prefix,
      key_sha256: generated.sha256,
      scopes,
    })
    .select("id, name, key_prefix, scopes, created_at")
    .single();

  if (error) return jsonWithRequestId({ error: error.message }, { status: 500 });

  return jsonWithRequestId(
    {
      api_key: {
        ...row,
        // Return the full key only once — it cannot be recovered
        key: generated.fullKey,
        warning: "Store this key securely. It will not be shown again.",
      },
    },
    { status: 201 }
  );
}

// GET /api/v1/api-keys?organization_id=... — list keys for an org
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson("Sign in required");

  const organizationId = new URL(request.url).searchParams.get("organization_id");
  if (!organizationId) return jsonWithRequestId({ error: "organization_id query param required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("org_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return unauthorizedJson("Not a member of this organization");

  const { data: keys } = await admin
    .from("org_api_keys")
    .select("id, name, key_prefix, scopes, revoked_at, last_used_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return jsonWithRequestId({ api_keys: keys ?? [] });
}
