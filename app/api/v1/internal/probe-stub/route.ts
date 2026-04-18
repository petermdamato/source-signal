import { createAdminClient } from "@/lib/supabase/admin";
import { recordStubConnectivityRun } from "@/lib/ai-connectivity-stub";
import { verifyMarketplaceApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

type Body = {
  companySlug?: string;
  companyId?: string;
  apiProductId?: string | null;
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

  let body: Body = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as Body;
  } catch {
    return jsonWithRequestId({ error: "Invalid JSON body" }, { status: 400 });
  }

  let companyId = body.companyId ?? null;
  if (!companyId && body.companySlug?.trim()) {
    const { data: c } = await admin.from("companies").select("id").eq("slug", body.companySlug.trim()).maybeSingle();
    companyId = c?.id ?? null;
  }
  if (!companyId) {
    const { data: first } = await admin.from("companies").select("id, slug").order("name").limit(1).maybeSingle();
    companyId = first?.id ?? null;
  }

  if (!companyId) {
    return jsonWithRequestId({ error: "No companies in database" }, { status: 404 });
  }

  try {
    const result = await recordStubConnectivityRun(admin, companyId, body.apiProductId ?? null);
    return jsonWithRequestId({
      ok: true,
      ...result,
      message: "Stub metrics and score recorded (not real probes).",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Probe failed";
    return jsonWithRequestId({ error: message }, { status: 500 });
  }
}
