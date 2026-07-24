import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOrgApiKey, unauthorizedJson, forbiddenJson, hasScope } from "@/lib/marketplace-api-auth";

type RouteContext = { params: Promise<{ productSlug: string; path: string[] }> };

const BLOCKED_REQUEST_HEADERS = new Set([
  "host", "authorization", "x-forwarded-for", "x-forwarded-host",
  "x-real-ip", "connection", "transfer-encoding",
]);

const BLOCKED_RESPONSE_HEADERS = new Set([
  "transfer-encoding", "connection", "keep-alive",
]);

/**
 * Marketplace Gateway — reverse proxy for platform-mode API products.
 *
 * Route: /api/marketplace/v1/{productSlug}/...path
 *
 * Auth: org API key with scope "data:read".
 * Checks:
 *   1. Valid org API key
 *   2. Active entitlement for a listing tied to this api_product slug
 *   3. (Future) rate limit / usage quota
 *
 * Connector type "rest_apikey": injects vendor credential as Bearer token.
 */
async function handle(request: NextRequest, context: RouteContext) {
  const { productSlug, path } = await context.params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const orgCtx = await verifyOrgApiKey(request);
  if (!orgCtx) return unauthorizedJson("Valid org API key required");
  if (!hasScope(orgCtx.scopes, "data:read")) return forbiddenJson("Scope data:read required");

  const admin = createAdminClient();

  // ── Load api_product by slug (we use listing slug as the product slug) ────
  type ListingWithProduct = {
    id: string;
    fulfillment_mode: string;
    api_products: { id: string; base_url: string | null; auth_type: string | null; connector_type: string | null } | null;
  };

  const { data: listingRaw } = await admin
    .from("marketplace_listings")
    .select("id, fulfillment_mode, api_products(id, base_url, auth_type, connector_type)")
    .eq("slug", productSlug)
    .eq("published", true)
    .single();

  const listing = listingRaw as unknown as ListingWithProduct | null;

  if (!listing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (listing.fulfillment_mode !== "platform") {
    return NextResponse.json(
      { error: "This product uses vendor-direct fulfillment. Contact the vendor directly." },
      { status: 403 }
    );
  }

  const apiProduct = listing.api_products;

  if (!apiProduct?.base_url) {
    return NextResponse.json({ error: "Product not configured for gateway access" }, { status: 503 });
  }

  // ── Check entitlement ─────────────────────────────────────────────────────
  const { data: entitlement } = await admin
    .from("entitlements")
    .select("id, status")
    .eq("organization_id", orgCtx.organizationId)
    .eq("listing_id", listing.id)
    .eq("status", "active")
    .single();

  if (!entitlement) {
    return NextResponse.json(
      { error: "No active entitlement for this product. Subscribe at /marketplace." },
      { status: 403 }
    );
  }

  // ── Load vendor credential ────────────────────────────────────────────────
  const { data: credRow } = await admin
    .from("vendor_credentials")
    .select("encrypted_value, credential_type")
    .eq("api_product_id", apiProduct.id)
    .eq("environment", "production")
    .single();

  // ── Build upstream URL ────────────────────────────────────────────────────
  const pathSegments = path.join("/");
  const upstreamSearch = new URL(request.url).search;
  const upstreamUrl = `${apiProduct.base_url.replace(/\/$/, "")}/${pathSegments}${upstreamSearch}`;

  // ── Forward request headers (strip sensitive) ─────────────────────────────
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!BLOCKED_REQUEST_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  // Inject vendor credential based on connector_type
  const connectorType = apiProduct.connector_type ?? "rest_apikey";
  if (credRow) {
    // In production: decrypt credRow.encrypted_value here before use.
    // For now: treat stored value as plaintext (replace with KMS decrypt in prod).
    const vendorKey = credRow.encrypted_value;
    if (connectorType === "rest_apikey" || credRow.credential_type === "api_key") {
      forwardHeaders.set("Authorization", `Bearer ${vendorKey}`);
    } else if (credRow.credential_type === "header") {
      forwardHeaders.set("X-API-Key", vendorKey);
    }
  }

  // ── Proxy the request ─────────────────────────────────────────────────────
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      // @ts-expect-error — Next.js streaming
      duplex: "half",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Gateway error: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // ── Record usage event (fire-and-forget) ─────────────────────────────────
  admin.from("usage_events").insert({
    organization_id: orgCtx.organizationId,
    entitlement_id: entitlement.id,
    api_key_id: orgCtx.keyId,
    units: 1,
    event_type: "api_request",
    metadata: {
      product_slug: productSlug,
      method: request.method,
      path: pathSegments,
      upstream_status: upstreamResponse.status,
    },
  }).then(() => {});

  // ── Build response ────────────────────────────────────────────────────────
  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  responseHeaders.set("X-Gateway", "source-signal");
  responseHeaders.set("X-Entitlement-Id", entitlement.id);

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
