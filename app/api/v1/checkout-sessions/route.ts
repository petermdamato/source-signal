import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonWithRequestId, unauthorizedJson } from "@/lib/marketplace-api-auth";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// POST /api/v1/checkout-sessions
// Body: { plan_id, organization_id, success_url?, cancel_url? }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson("Sign in required");

  let body: { plan_id?: string; organization_id?: string; success_url?: string; cancel_url?: string } = {};
  try { body = await request.json(); } catch { /* ok */ }

  const { plan_id, organization_id, success_url, cancel_url } = body;
  if (!plan_id || !organization_id) {
    return jsonWithRequestId({ error: "plan_id and organization_id are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify membership
  const { data: membership } = await admin
    .from("org_members")
    .select("role")
    .eq("organization_id", organization_id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return unauthorizedJson("Not a member of this organization");

  type PlanWithListing = {
    id: string; name: string; price_cents: number; currency: string;
    interval: string | null; stripe_price_id: string | null; listing_id: string;
    marketplace_listings: { id: string; slug: string; title: string; fulfillment_mode: string; company_id: string | null } | null;
  };

  // Load plan + listing
  const { data: planRaw } = await admin
    .from("marketplace_plans")
    .select("id, name, price_cents, currency, interval, stripe_price_id, listing_id, marketplace_listings(id, slug, title, fulfillment_mode, company_id)")
    .eq("id", plan_id)
    .eq("active", true)
    .single();

  const plan = planRaw as unknown as PlanWithListing | null;
  if (!plan) return jsonWithRequestId({ error: "Plan not found or inactive" }, { status: 404 });

  const listing = plan.marketplace_listings;
  if (!listing) return jsonWithRequestId({ error: "Listing not found" }, { status: 404 });

  if (listing.fulfillment_mode === "vendor_direct") {
    // For vendor_direct we just create a connection_request; company_id is a
    // required uuid FK, so a listing without a company can't take requests.
    if (!listing.company_id) {
      return jsonWithRequestId(
        { error: "This listing is not accepting connection requests yet" },
        { status: 409 }
      );
    }
    const { error: insertError } = await admin.from("connection_requests").insert({
      company_id: listing.company_id,
      source: "marketplace",
      requester_contact: user.email ?? "",
      metadata: { plan_id, organization_id, listing_slug: listing.slug },
    });
    if (insertError) {
      return jsonWithRequestId(
        { error: "Failed to submit connection request. Please try again." },
        { status: 500 }
      );
    }
    return jsonWithRequestId({
      mode: "vendor_direct",
      message: "Connection request submitted. The vendor will reach out to complete the process.",
    }, { status: 202 });
  }

  // Platform SKU — create Stripe checkout session
  const s = stripe();

  // Ensure org has a Stripe customer
  const { data: orgRaw } = await admin.from("organizations").select("stripe_customer_id, billing_email, name").eq("id", organization_id).single();
  const org = orgRaw as { stripe_customer_id: string | null; billing_email: string | null; name: string } | null;
  let customerId = org?.stripe_customer_id;
  if (!customerId) {
    const customer = await s.customers.create({
      email: org?.billing_email ?? user.email ?? undefined,
      name: org?.name,
      metadata: { organization_id },
    });
    customerId = customer.id;
    await admin.from("organizations").update({ stripe_customer_id: customerId }).eq("id", organization_id);
  }

  // Free plan — provision directly without Stripe
  if (plan.price_cents === 0) {
    const { data: subRaw } = await admin.from("subscriptions").insert({
      organization_id,
      plan_id: plan.id,
      status: "active",
      current_period_start: new Date().toISOString(),
    }).select("id").single();
    const sub = subRaw as { id: string } | null;

    if (sub) {
      await admin.from("entitlements").insert({
        organization_id,
        listing_id: listing.id,
        subscription_id: sub.id,
        status: "active",
      });
    }

    const redirectUrl = success_url ?? `${APP_URL}/dashboard-protected-routes/developers?org=${organization_id}&success=1`;
    return jsonWithRequestId({ mode: "free", redirect_url: redirectUrl });
  }

  // Paid plan — create Stripe session
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = plan.stripe_price_id
    ? [{ price: plan.stripe_price_id, quantity: 1 }]
    : [
        {
          price_data: {
            currency: plan.currency,
            unit_amount: plan.price_cents,
            product_data: { name: `${listing.title} — ${plan.name}` },
            ...(plan.interval === "month" || plan.interval === "year"
              ? { recurring: { interval: plan.interval as "month" | "year" } }
              : {}),
          },
          quantity: 1,
        },
      ];

  // Create a pending subscription record for webhook to activate
  const { data: pendingSubRaw } = await admin.from("subscriptions").insert({
    organization_id,
    plan_id: plan.id,
    status: "pending",
  }).select("id").single();
  const pendingSub = pendingSubRaw as { id: string } | null;

  const session = await s.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: plan.interval === "month" || plan.interval === "year" ? "subscription" : "payment",
    line_items: lineItems,
    success_url: success_url ?? `${APP_URL}/dashboard-protected-routes/developers?org=${organization_id}&success=1`,
    cancel_url: cancel_url ?? `${APP_URL}/marketplace/${listing.slug}`,
    metadata: {
      organization_id,
      plan_id: plan.id,
      listing_id: listing.id,
      subscription_id: pendingSub?.id ?? "",
    },
  });

  if (pendingSub) {
    await admin.from("subscriptions").update({ stripe_checkout_session_id: session.id }).eq("id", pendingSub.id);
  }

  return jsonWithRequestId({ checkout_url: session.url, session_id: session.id });
}
