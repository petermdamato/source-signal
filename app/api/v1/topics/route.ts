import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonWithRequestId } from "@/lib/marketplace-api-auth";

// GET /api/v1/topics — list all marketplace topics
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("marketplace_topics")
    .select("id, slug, label, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error) return jsonWithRequestId({ error: error.message }, { status: 500 });
  return jsonWithRequestId({ topics: data ?? [] });
}
