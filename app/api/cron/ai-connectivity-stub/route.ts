import { createAdminClient } from "@/lib/supabase/admin";
import { recordStubConnectivityRun } from "@/lib/ai-connectivity-stub";
import { verifyCronSecret, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return unauthorizedJson("Invalid or missing CRON_SECRET");
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

  const url = new URL(request.url);
  const slug = url.searchParams.get("company_slug")?.trim();

  let companyId: string | null = null;
  if (slug) {
    const { data: c } = await admin.from("companies").select("id").eq("slug", slug).maybeSingle();
    companyId = c?.id ?? null;
    if (!companyId) {
      return jsonWithRequestId({ error: `No company with slug ${slug}` }, { status: 404 });
    }
  } else {
    const { data: first } = await admin.from("companies").select("id, slug").order("name").limit(1).maybeSingle();
    companyId = first?.id ?? null;
  }

  if (!companyId) {
    return jsonWithRequestId({ error: "No companies in database" }, { status: 404 });
  }

  try {
    const result = await recordStubConnectivityRun(admin, companyId, null);
    return jsonWithRequestId({
      ok: true,
      companyId,
      ...result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cron probe failed";
    return jsonWithRequestId({ error: message }, { status: 500 });
  }
}
