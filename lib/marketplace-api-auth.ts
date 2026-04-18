import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function verifyMarketplaceApiKey(request: Request): boolean {
  const envKey = process.env.MARKETPLACE_API_KEY;
  if (!envKey?.length) return false;
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  const token = m?.[1]?.trim();
  if (!token || token.length !== envKey.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(envKey));
  } catch {
    return false;
  }
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret?.length) return false;
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  const token = m?.[1]?.trim();
  if (!token || token.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

export function unauthorizedJson(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function jsonWithRequestId(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("X-Request-Id", crypto.randomUUID());
  return NextResponse.json(body, { ...init, headers });
}
