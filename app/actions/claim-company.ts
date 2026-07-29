"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { activeCompaniesFilter } from "@/lib/companies-active";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_NAME = "Source Signal";

/** Extract allowed email domain(s) from company website URL. Returns e.g. ["acme.com", "www.acme.com"] */
function getAllowedDomains(websiteUrl: string | null): string[] {
  if (!websiteUrl?.trim()) return [];
  try {
    const u = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    const host = u.hostname.toLowerCase();
    const domains = [host];
    if (host.startsWith("www.")) domains.push(host.slice(4));
    else domains.push(`www.${host}`);
    return domains;
  } catch {
    return [];
  }
}

function emailMatchesDomain(email: string, allowedDomains: string[]): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return allowedDomains.some((d) => domain === d);
}

export type RequestClaimState = { error?: string; ok?: boolean };

export async function requestCompanyClaim(
  companySlug: string,
  companyName: string,
  websiteUrl: string | null,
  companyId: string,
  email: string
): Promise<RequestClaimState> {
  const allowedDomains = getAllowedDomains(websiteUrl);
  if (allowedDomains.length === 0) {
    return { error: "This company has no website URL. Contact support to claim." };
  }
  if (!emailMatchesDomain(email, allowedDomains)) {
    return {
      error: `Please use an email address at your company's domain (e.g. @${allowedDomains[0]}).`,
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("company_claim_tokens").insert({
    company_id: companyId,
    email: email.trim().toLowerCase(),
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    return { error: "Failed to create verification link. Please try again." };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const verifyUrl = `${baseUrl}/companies/${companySlug}/claim/verify?token=${token}`;

  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email.trim(),
    subject: `Confirm your claim of ${companyName} on ${APP_NAME}`,
    html: `
      <p>You requested to claim the company profile for <strong>${companyName}</strong> on ${APP_NAME}.</p>
      <p>Click the link below to confirm. This link expires in 24 hours.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (sendError) {
    await admin.from("company_claim_tokens").delete().eq("token", token);
    return { error: "Failed to send verification email. Please try again." };
  }

  revalidatePath(`/companies/${companySlug}`);
  revalidatePath(`/companies/${companySlug}/claim`);
  return { ok: true };
}

export type VerifyTokenResult =
  | { valid: true; companySlug: string; companyName: string; email: string }
  | { valid: false; error: string };

/** Look up claim token (for verify page). Uses admin client. */
export async function getClaimTokenInfo(token: string): Promise<VerifyTokenResult> {
  if (!token?.trim()) return { valid: false, error: "Missing verification link." };
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("company_claim_tokens")
    .select("company_id, email, expires_at, companies(slug, name)")
    .eq("token", token.trim())
    .single();

  if (error || !row) return { valid: false, error: "Invalid or expired link." };
  const expiresAt = new Date(row.expires_at);
  if (expiresAt < new Date()) return { valid: false, error: "This link has expired." };
  const company = row.companies as { slug: string; name: string } | null;
  if (!company) return { valid: false, error: "Company not found." };
  return {
    valid: true,
    companySlug: company.slug,
    companyName: company.name,
    email: row.email,
  };
}

/** Returns one unclaimed company whose website domain matches the current user's email domain, or null. */
export async function getUnclaimedCompanyForCurrentUser(): Promise<{
  slug: string;
  name: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const emailDomain = user.email.trim().toLowerCase().split("@")[1];
  if (!emailDomain) return null;

  const { data: companies } = await activeCompaniesFilter(
    supabase
      .from("companies")
      .select("id, name, slug, website_url")
      .eq("claimed", false)
      .not("website_url", "is", null)
  );

  if (!companies?.length) return null;
  for (const c of companies) {
    const allowed = getAllowedDomains(c.website_url);
    if (allowed.some((d) => d === emailDomain)) {
      return { slug: c.slug, name: c.name };
    }
  }
  return null;
}

export type CompleteClaimState = { error?: string; ok?: boolean; companySlug?: string };

/** Complete claim: caller must be logged in; their email must match token email. */
export async function completeCompanyClaim(token: string): Promise<CompleteClaimState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in to complete the claim." };

  const tokenInfo = await getClaimTokenInfo(token);
  if (!tokenInfo.valid) return { error: tokenInfo.error };
  if (tokenInfo.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      error: `Please sign in with the email you used to request the claim (${tokenInfo.email}).`,
    };
  }

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("company_claim_tokens")
    .select("company_id")
    .eq("token", token.trim())
    .single();
  if (!tokenRow) return { error: "Invalid or expired link." };

  const { error: updateError } = await admin.from("companies").update({
    claimed: true,
    claimed_contact: tokenInfo.email,
    claimed_by_user_id: user.id,
    updated_at: new Date().toISOString(),
  }).eq("id", tokenRow.company_id);

  if (updateError) return { error: "Failed to claim company." };
  await admin.from("company_claim_tokens").delete().eq("token", token.trim());
  revalidatePath(`/companies/${tokenInfo.companySlug}`);
  revalidatePath(`/companies/${tokenInfo.companySlug}/claim`);
  revalidatePath(`/companies/${tokenInfo.companySlug}/claim/verify`);
  revalidatePath(`/companies/${tokenInfo.companySlug}/edit`);
  return { ok: true, companySlug: tokenInfo.companySlug };
}
