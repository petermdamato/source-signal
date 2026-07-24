import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonWithRequestId,
  unauthorizedJson,
  verifyOrgApiKey,
} from "@/lib/marketplace-api-auth";

// GET /api/v1/usage?organization_id=...&days=30
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 90);
  const admin = createAdminClient();
  let organizationId: string | null = null;

  // Try org API key first
  const orgCtx = await verifyOrgApiKey(request);
  if (orgCtx) {
    organizationId = orgCtx.organizationId;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedJson("Sign in or provide an API key");

    const orgId = url.searchParams.get("organization_id");
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

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await admin
    .from("usage_events")
    .select("units, event_type, recorded_at, entitlement_id")
    .eq("organization_id", organizationId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false });

  const totalUnits = (events ?? []).reduce((sum, e) => sum + e.units, 0);
  const byType = (events ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + e.units;
    return acc;
  }, {});

  return jsonWithRequestId({
    organization_id: organizationId,
    period_days: days,
    since,
    total_units: totalUnits,
    by_event_type: byType,
    event_count: (events ?? []).length,
  });
}
