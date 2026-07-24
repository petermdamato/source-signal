import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonWithRequestId, unauthorizedJson } from "@/lib/marketplace-api-auth";

// DELETE /api/v1/api-keys/:id — revoke a key
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson("Sign in required");

  const admin = createAdminClient();
  const { data: keyRow } = await admin
    .from("org_api_keys")
    .select("id, organization_id, revoked_at")
    .eq("id", id)
    .single();

  if (!keyRow) return jsonWithRequestId({ error: "Key not found" }, { status: 404 });
  if (keyRow.revoked_at) return jsonWithRequestId({ error: "Key already revoked" }, { status: 409 });

  // Verify user belongs to the key's org
  const { data: membership } = await admin
    .from("org_members")
    .select("role")
    .eq("organization_id", keyRow.organization_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return unauthorizedJson("Not a member of this organization");

  await admin
    .from("org_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  return jsonWithRequestId({ ok: true, revoked_at: new Date().toISOString() });
}
