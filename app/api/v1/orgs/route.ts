import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonWithRequestId, unauthorizedJson } from "@/lib/marketplace-api-auth";

// POST /api/v1/orgs — create an organization for the current user
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson("Sign in required");

  let body: { name?: string } = {};
  try { body = await request.json(); } catch { /* ok */ }

  const name = body.name?.trim();
  if (!name) {
    return jsonWithRequestId({ error: "name is required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const admin = createAdminClient();

  const { data: orgRaw, error } = await admin
    .from("organizations")
    .insert({ name, slug, billing_email: user.email ?? null })
    .select("id, name, slug, billing_email, created_at")
    .single();
  const org = orgRaw as { id: string; name: string; slug: string; billing_email: string | null; created_at: string } | null;

  if (error || !org) {
    const msg = error?.code === "23505" ? "An organization with that name already exists." : (error?.message ?? "Unknown error");
    return jsonWithRequestId({ error: msg }, { status: 400 });
  }

  await admin.from("org_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  return jsonWithRequestId({ organization: org }, { status: 201 });
}

// GET /api/v1/orgs — list orgs the current user belongs to
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson("Sign in required");

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("org_members")
    .select("role, organizations(id, name, slug, billing_email, created_at)")
    .eq("user_id", user.id);

  const orgs = memberships?.map((m) => ({ ...(m.organizations as object), role: m.role })) ?? [];
  return jsonWithRequestId({ organizations: orgs });
}
