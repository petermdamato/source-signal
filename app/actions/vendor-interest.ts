"use server";

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const TO_EMAIL = process.env.VENDOR_INTEREST_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "hello@sourcesignal.co";
const APP_NAME = "Source Signal";

export type VendorInterestState = { error?: string; ok?: boolean };

export async function submitVendorInterest(
  _prev: VendorInterestState,
  formData: FormData
): Promise<VendorInterestState> {
  const companyName = formData.get("company_name")?.toString().trim() ?? "";
  const contactEmail = formData.get("contact_email")?.toString().trim() ?? "";
  const contactName = formData.get("contact_name")?.toString().trim() ?? "";
  const websiteUrl = formData.get("website_url")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";

  if (!companyName || !contactEmail) {
    return { error: "Company name and email are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  await admin.from("vendor_interest_inquiries").insert({
    company_name: companyName,
    contact_email: contactEmail,
    contact_name: contactName || null,
    website_url: websiteUrl || null,
    description: description || null,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: `New vendor interest: ${companyName}`,
    html: `
      <h2>New vendor inquiry on ${APP_NAME}</h2>
      <table cellpadding="4" style="font-family:sans-serif;font-size:14px;">
        <tr><td><strong>Company</strong></td><td>${companyName}</td></tr>
        <tr><td><strong>Contact</strong></td><td>${contactName || "—"}</td></tr>
        <tr><td><strong>Email</strong></td><td><a href="mailto:${contactEmail}">${contactEmail}</a></td></tr>
        ${websiteUrl ? `<tr><td><strong>Website</strong></td><td><a href="${websiteUrl}">${websiteUrl}</a></td></tr>` : ""}
        ${description ? `<tr><td><strong>Description</strong></td><td>${description.replace(/\n/g, "<br>")}</td></tr>` : ""}
      </table>
    `,
  });

  return { ok: true };
}
