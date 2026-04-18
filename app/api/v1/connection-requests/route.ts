import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMarketplaceApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

type Body = {
  companyId?: string;
  companySlug?: string;
  requesterContact?: string | null;
  requesterNote?: string | null;
  metadata?: Record<string, unknown>;
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

  const { companyId, companySlug, requesterContact, requesterNote, metadata } = body;
  if (!companyId && !companySlug?.trim()) {
    return jsonWithRequestId(
      { error: "Provide companyId or companySlug" },
      { status: 400 }
    );
  }

  let resolvedId = companyId ?? null;
  if (!resolvedId && companySlug?.trim()) {
    const { data: c } = await admin.from("companies").select("id").eq("slug", companySlug.trim()).maybeSingle();
    resolvedId = c?.id ?? null;
  }

  if (!resolvedId) {
    return jsonWithRequestId({ error: "Company not found" }, { status: 404 });
  }

  const { data: row, error } = await admin
    .from("connection_requests")
    .insert({
      company_id: resolvedId,
      source: "api",
      requester_contact: requesterContact ?? null,
      requester_note: requesterNote ?? null,
      metadata: (metadata ?? {}) as never,
      status: "pending",
    })
    .select("id, company_id, status, created_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: error.message }, { status: 500 });
  }

  return jsonWithRequestId(
    {
      connectionRequest: row,
      nextStep: "Stub: notify vendor or ops from your worker; no email sent in v1.",
    },
    { status: 201 }
  );
}
