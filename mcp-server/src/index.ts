import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (process.env.SOURCE_SIGNAL_API_BASE ?? "http://localhost:3000").replace(/\/$/, "");
// Accept either MARKETPLACE_API_KEY (admin/legacy) or SOURCE_SIGNAL_API_KEY (org scoped ss_live_...)
const apiKey = process.env.SOURCE_SIGNAL_API_KEY ?? process.env.MARKETPLACE_API_KEY ?? "";

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(typeof body === "object" && body && "error" in body ? String((body as { error: string }).error) : res.statusText);
  }
  return body;
}

async function apiPost(path: string, json: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(typeof body === "object" && body && "error" in body ? String((body as { error: string }).error) : res.statusText);
  }
  return body;
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const server = new McpServer({
  name: "source-signal-marketplace",
  version: "0.1.0",
});

server.registerTool(
  "get_vendor_rating",
  {
    description:
      "Fetch a data vendor profile, human review aggregates (averages, counts), and latest AI connectivity score if present.",
    inputSchema: { slug: z.string().describe("Company slug from the directory URL") },
  },
  async ({ slug }) => {
    const data = await apiGet(`/api/v1/vendors/${encodeURIComponent(slug)}`);
    return jsonResult(data);
  }
);

server.registerTool(
  "search_vendors",
  {
    description: "Search the vendor directory by name or description substring.",
    inputSchema: {
      q: z.string().optional().describe("Search query"),
      limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)"),
    },
  },
  async ({ q, limit }) => {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    if (limit != null) params.set("limit", String(limit));
    const qs = params.toString();
    const data = await apiGet(`/api/v1/vendors${qs ? `?${qs}` : ""}`);
    return jsonResult(data);
  }
);

server.registerTool(
  "list_vendor_api_products",
  {
    description: "List registered API products (metadata) for a vendor slug.",
    inputSchema: { slug: z.string().describe("Company slug") },
  },
  async ({ slug }) => {
    const data = await apiGet(`/api/v1/vendors/${encodeURIComponent(slug)}/api-products`);
    return jsonResult(data);
  }
);

server.registerTool(
  "request_connection",
  {
    description:
      "Create a marketplace connection / RFQ stub for a vendor (by slug or id). Does not perform billing or live API handoff.",
    inputSchema: {
      companySlug: z.string().optional().describe("Vendor slug"),
      companyId: z.string().uuid().optional().describe("Vendor UUID"),
      requesterContact: z.string().optional().describe("Email or handle for follow-up"),
      requesterNote: z.string().optional().describe("Short note about intent"),
    },
  },
  async ({ companySlug, companyId, requesterContact, requesterNote }) => {
    if (!companySlug && !companyId) {
      return { content: [{ type: "text", text: "Error: provide companySlug or companyId" }], isError: true };
    }
    const data = await apiPost("/api/v1/connection-requests", {
      companySlug: companySlug ?? undefined,
      companyId: companyId ?? undefined,
      requesterContact: requesterContact ?? null,
      requesterNote: requesterNote ?? null,
    });
    return jsonResult(data);
  }
);

server.registerTool(
  "get_vendor_ai_connectivity",
  {
    description: "Return the latest published AI connectivity score for a vendor (stub methodology until real probes ship).",
    inputSchema: { slug: z.string().describe("Company slug") },
  },
  async ({ slug }) => {
    const data = await apiGet(`/api/v1/vendors/${encodeURIComponent(slug)}/ai-score`);
    return jsonResult(data);
  }
);

// ── Marketplace commerce tools ─────────────────────────────────────────────

server.registerTool(
  "list_marketplace_listings",
  {
    description:
      "List published marketplace listings. Returns product titles, plans with pricing, fulfillment mode (platform = instant gateway access, vendor_direct = vendor contact required), and company info.",
    inputSchema: {
      limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)"),
      fulfillment_mode: z
        .enum(["platform", "vendor_direct"])
        .optional()
        .describe("Filter by fulfillment mode"),
    },
  },
  async ({ limit, fulfillment_mode }) => {
    const params = new URLSearchParams();
    if (limit != null) params.set("limit", String(limit));
    if (fulfillment_mode) params.set("fulfillment_mode", fulfillment_mode);
    const qs = params.toString();
    const data = await apiGet(`/api/v1/listings${qs ? `?${qs}` : ""}`);
    return jsonResult(data);
  }
);

server.registerTool(
  "get_marketplace_listing",
  {
    description: "Get full details for a marketplace listing by slug, including plans, API product details, and license terms.",
    inputSchema: { slug: z.string().describe("Listing slug") },
  },
  async ({ slug }) => {
    const data = await apiGet(`/api/v1/listings/${encodeURIComponent(slug)}`);
    return jsonResult(data);
  }
);

server.registerTool(
  "create_checkout_session",
  {
    description:
      "Create a checkout session to subscribe to a marketplace plan. For platform SKUs with a saved payment method this may activate immediately; otherwise returns a checkout_url for the human to approve. Requires scope 'subscribe'.",
    inputSchema: {
      plan_id: z.string().uuid().describe("Plan UUID from list_marketplace_listings"),
      organization_id: z.string().uuid().describe("Organization UUID to subscribe under"),
    },
  },
  async ({ plan_id, organization_id }) => {
    const data = await apiPost("/api/v1/checkout-sessions", { plan_id, organization_id });
    return jsonResult(data);
  }
);

server.registerTool(
  "get_entitlements",
  {
    description:
      "List active entitlements (subscriptions) for an organization. An active entitlement means the org can call the gateway for that listing. Requires scope 'catalog:read'.",
    inputSchema: {
      organization_id: z.string().uuid().describe("Organization UUID"),
    },
  },
  async ({ organization_id }) => {
    const data = await apiGet(`/api/v1/entitlements?organization_id=${encodeURIComponent(organization_id)}`);
    return jsonResult(data);
  }
);

server.registerTool(
  "get_usage",
  {
    description: "Get API usage summary for an organization over the last 30 days. Requires scope 'catalog:read'.",
    inputSchema: {
      organization_id: z.string().uuid().describe("Organization UUID"),
      days: z.number().int().min(1).max(90).optional().describe("Days to look back (default 30)"),
    },
  },
  async ({ organization_id, days = 30 }) => {
    const params = new URLSearchParams({ organization_id, days: String(days) });
    const data = await apiGet(`/api/v1/usage?${params.toString()}`);
    return jsonResult(data);
  }
);

async function main() {
  if (!apiKey) {
    console.error(
      "Set SOURCE_SIGNAL_API_KEY (org-scoped ss_live_... key from Developer Hub) or MARKETPLACE_API_KEY (admin key)."
    );
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
