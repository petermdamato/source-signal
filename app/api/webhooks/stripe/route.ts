import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Idempotency: skip if already processed
  const { data: existing } = await admin
    .from("webhook_events")
    .select("id")
    .eq("id", event.id)
    .single();
  if (existing) return NextResponse.json({ ok: true, skipped: true });

  // Record the event
  await admin.from("webhook_events").insert({
    id: event.id,
    type: event.type,
    payload: JSON.parse(JSON.stringify(event)),
  });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, admin);
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub, admin, event.type === "customer.subscription.deleted");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, admin);
        break;
      }
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  admin: ReturnType<typeof createAdminClient>
) {
  const { organization_id, plan_id, listing_id, subscription_id } = session.metadata ?? {};
  if (!organization_id || !listing_id) return;

  const now = new Date().toISOString();

  const sessionAny = session as unknown as Record<string, unknown>;
  const stripeSubId = (sessionAny.subscription ?? null) as string | null;

  // Activate subscription row
  if (subscription_id) {
    await admin
      .from("subscriptions")
      .update({
        status: "active",
        stripe_subscription_id: stripeSubId,
        stripe_checkout_session_id: session.id,
        current_period_start: now,
        updated_at: now,
      })
      .eq("id", subscription_id);
  } else if (plan_id) {
    // Create subscription if not pre-created
    await admin.from("subscriptions").insert({
      organization_id,
      plan_id,
      stripe_subscription_id: stripeSubId,
      stripe_checkout_session_id: session.id,
      status: "active",
      current_period_start: now,
    });
  }

  // Create or activate entitlement
  const { data: existingRaw } = await admin
    .from("entitlements")
    .select("id")
    .eq("organization_id", organization_id)
    .eq("listing_id", listing_id)
    .single();
  const existing = existingRaw as { id: string } | null;

  if (existing) {
    await admin
      .from("entitlements")
      .update({ status: "active", updated_at: now })
      .eq("id", existing.id);
  } else {
    await admin.from("entitlements").insert({
      organization_id,
      listing_id,
      subscription_id: subscription_id ?? null,
      status: "active",
    });
  }
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>,
  deleted: boolean
) {
  const status = deleted
    ? "canceled"
    : sub.status === "active"
    ? "active"
    : sub.status === "past_due"
    ? "past_due"
    : "incomplete";

  const { data: rowsRaw } = await admin
    .from("subscriptions")
    .select("id, organization_id")
    .eq("stripe_subscription_id", sub.id);
  const rows = rowsRaw as { id: string; organization_id: string }[] | null;

  for (const row of rows ?? []) {
    await admin
      .from("subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (deleted || sub.status === "canceled") {
      await admin
        .from("entitlements")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("subscription_id", row.id);
    }
  }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createAdminClient>
) {
  // In newer Stripe API versions, subscription may be on parent or as ID
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subscriptionId = (invoiceAny.subscription ?? invoiceAny.subscription_id ?? null) as string | null;
  if (!subscriptionId) return;

  const { data: rowsRaw2 } = await admin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId);
  const rows2 = rowsRaw2 as { id: string }[] | null;

  for (const row of rows2 ?? []) {
    await admin
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("id", row.id);

    await admin
      .from("entitlements")
      .update({ status: "suspended", updated_at: new Date().toISOString() })
      .eq("subscription_id", row.id);
  }
}
