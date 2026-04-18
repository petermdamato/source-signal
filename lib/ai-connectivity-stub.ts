import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

const METHODOLOGY_VERSION = "stub-0.1.0";
const AGENT_VERSION = "stub-0.1.0";

type Admin = SupabaseClient<Database>;

/** Inserts a completed stub run, fake metrics, and a score row. Requires service-role client. */
export async function recordStubConnectivityRun(
  admin: Admin,
  companyId: string,
  apiProductId: string | null = null
): Promise<{ runId: string; scoreId: string }> {
  const { data: run, error: runErr } = await admin
    .from("ai_connectivity_runs")
    .insert({
      company_id: companyId,
      api_product_id: apiProductId,
      status: "completed",
      completed_at: new Date().toISOString(),
      agent_version: AGENT_VERSION,
    })
    .select("id")
    .single();

  if (runErr || !run) {
    throw new Error(runErr?.message ?? "Failed to create connectivity run");
  }

  const runId = run.id;
  const metrics: { metric_key: string; numeric_value: number; details: Json }[] = [
    { metric_key: "docs_reachability", numeric_value: 0.85, details: { stub: true } },
    { metric_key: "auth_flow_clarity", numeric_value: 0.72, details: { stub: true } },
    { metric_key: "latency_ms", numeric_value: 120, details: { stub: true } },
  ];

  const { error: mErr } = await admin.from("ai_connectivity_metrics").insert(
    metrics.map((m) => ({
      run_id: runId,
      metric_key: m.metric_key,
      numeric_value: m.numeric_value,
      details: m.details,
    }))
  );
  if (mErr) throw new Error(mErr.message);

  const aggregate =
    (metrics.reduce((s, m) => s + (m.numeric_value ?? 0), 0) / metrics.length) * 100;
  const score = Math.min(100, Math.max(0, Math.round(aggregate)));

  const { data: scoreRow, error: sErr } = await admin
    .from("ai_connectivity_scores")
    .insert({
      company_id: companyId,
      api_product_id: apiProductId,
      score,
      methodology_version: METHODOLOGY_VERSION,
    })
    .select("id")
    .single();

  if (sErr || !scoreRow) {
    throw new Error(sErr?.message ?? "Failed to create connectivity score");
  }

  return { runId, scoreId: scoreRow.id };
}
