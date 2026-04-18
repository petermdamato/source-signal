import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (process.env.SOURCE_SIGNAL_API_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.MARKETPLACE_API_KEY ?? "";

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

async function main() {
  if (!apiKey) {
    console.error("MARKETPLACE_API_KEY is required.");
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
