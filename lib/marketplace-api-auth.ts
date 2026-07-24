import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Admin / internal key (single env secret, cron + probes only) ────────────

export function verifyAdminApiKey(request: Request): boolean {
  const envKey = process.env.MARKETPLACE_API_KEY;
  if (!envKey?.length) return false;
  const token = extractBearerToken(request);
  if (!token || token.length !== envKey.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(envKey));
  } catch {
    return false;
  }
}

/** @deprecated Use verifyAdminApiKey. Kept for compatibility with existing routes. */
export const verifyMarketplaceApiKey = verifyAdminApiKey;

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret?.length) return false;
  const token = extractBearerToken(request);
  if (!token || token.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

// ─── Org-scoped API keys (ss_live_... / ss_test_...) ─────────────────────────

export interface OrgKeyContext {
  keyId: string;
  organizationId: string;
  scopes: string[];
}

/**
 * Verify an org API key against the database.
 * Returns the key context if valid, null if not found/revoked.
 * Also updates last_used_at asynchronously.
 */
export async function verifyOrgApiKey(
  request: Request
): Promise<OrgKeyContext | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  if (!token.startsWith("ss_live_") && !token.startsWith("ss_test_")) return null;

  const hash = sha256Hex(token);
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("org_api_keys")
    .select("id, organization_id, scopes, revoked_at")
    .eq("key_sha256", hash)
    .single();

  if (!row || row.revoked_at) return null;

  // Update last_used_at without awaiting (fire-and-forget)
  admin
    .from("org_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(() => {});

  return {
    keyId: row.id,
    organizationId: row.organization_id,
    scopes: row.scopes ?? [],
  };
}

/**
 * Verify request using org key first, then fall back to admin env key.
 * Returns { orgCtx } for org keys, { isAdmin: true } for admin key, null for unauthorized.
 */
export async function verifyAnyApiKey(
  request: Request
): Promise<{ orgCtx: OrgKeyContext; isAdmin: false } | { isAdmin: true; orgCtx: null } | null> {
  const orgCtx = await verifyOrgApiKey(request);
  if (orgCtx) return { orgCtx, isAdmin: false };
  if (verifyAdminApiKey(request)) return { isAdmin: true, orgCtx: null };
  return null;
}

export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes("*");
}

// ─── Key generation ───────────────────────────────────────────────────────────

export interface GeneratedKey {
  fullKey: string;      // returned once to caller, never stored
  prefix: string;       // safe to display (e.g. "ss_live_ab12cd34")
  sha256: string;       // stored in DB
}

export function generateOrgApiKey(live = true): GeneratedKey {
  const prefix = live ? "ss_live_" : "ss_test_";
  const random = crypto.randomUUID().replace(/-/g, "");
  const fullKey = `${prefix}${random}`;
  return {
    fullKey,
    prefix: fullKey.slice(0, prefix.length + 8), // first 8 chars of random for display
    sha256: sha256Hex(fullKey),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m?.[1]?.trim() ?? null;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function unauthorizedJson(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenJson(message = "Insufficient scope") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function jsonWithRequestId(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("X-Request-Id", crypto.randomUUID());
  return NextResponse.json(body, { ...init, headers });
}
