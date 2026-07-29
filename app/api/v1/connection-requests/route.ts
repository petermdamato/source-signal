import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAnyApiKey, unauthorizedJson, jsonWithRequestId } from "@/lib/marketplace-api-auth";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_NAME = "Source Signal";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

type Body = {
  companyId?: string;
  companySlug?: string;
  requesterContact?: string | null;
  requesterNote?: string | null;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const authResult = await verifyAnyApiKey(request);
  if (!authResult) return unauthorizedJson();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonWithRequestId({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonWithRequestId({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, companySlug, requesterContact, requesterNote, metadata } = body;
  if (!companyId && !companySlug?.trim()) {
    return jsonWithRequestId({ error: "Provide companyId or companySlug" }, { status: 400 });
  }

  // Resolve company
  let resolvedId = companyId ?? null;
  let company: { id: string; name: string; slug: string; claimed_contact: string | null } | null = null;
  if (!resolvedId && companySlug?.trim()) {
    const { data: c } = await admin
      .from("companies")
      .select("id, name, slug, claimed_contact")
      .eq("slug", companySlug.trim())
      .eq("is_active", true)
      .maybeSingle();
    company = c;
    resolvedId = c?.id ?? null;
  } else if (resolvedId) {
    const { data: c } = await admin
      .from("companies")
      .select("id, name, slug, claimed_contact")
      .eq("id", resolvedId)
      .eq("is_active", true)
      .maybeSingle();
    company = c;
  }

  if (!resolvedId || !company) {
    return jsonWithRequestId({ error: "Company not found" }, { status: 404 });
  }

  const source = authResult.isAdmin ? "api" : "marketplace";
  const { data: row, error } = await admin
    .from("connection_requests")
    .insert({
      company_id: resolvedId,
      source,
      requester_contact: requesterContact ?? null,
      requester_note: requesterNote ?? null,
      metadata: (metadata ?? {}) as never,
      status: "pending",
    })
    .select("id, company_id, status, created_at")
    .single();

  if (error) return jsonWithRequestId({ error: error.message }, { status: 500 });

  // Notify vendor if company is claimed and has a contact email
  const vendorEmail = company.claimed_contact;
  if (vendorEmail && process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: vendorEmail,
      subject: `New connection request on ${APP_NAME}`,
      html: `
        <p>Someone is interested in connecting with <strong>${company.name}</strong> through ${APP_NAME}.</p>
        ${requesterContact ? `<p><strong>Requester:</strong> ${requesterContact}</p>` : ""}
        ${requesterNote ? `<p><strong>Note:</strong> ${requesterNote}</p>` : ""}
        <p>
          <a href="${APP_URL}/companies/${company.slug}/edit">View your company dashboard</a>
        </p>
        <p style="color:#888;font-size:12px;">Request ID: ${row.id}</p>
      `,
    }).catch(() => { /* Email failure is non-fatal */ });
  }

  return jsonWithRequestId(
    {
      connectionRequest: row,
      nextStep:
        vendorEmail
          ? "Vendor notified by email."
          : "Vendor not yet claimed — no notification sent. Ops will follow up.",
    },
    { status: 201 }
  );
}
