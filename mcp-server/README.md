# Source Signal MCP server

stdio MCP server that wraps the Next.js **`/api/v1`** marketplace endpoints.

## Prerequisites

1. Run the web app (`npm run dev` in the repo root) with Supabase migrations applied (including `013_marketplace_mcp_skeleton.sql`).
2. Set **`MARKETPLACE_API_KEY`** in the web app environment (same value the MCP server uses).

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `MARKETPLACE_API_KEY` | (required) | Bearer token for `/api/v1/*` |
| `SOURCE_SIGNAL_API_BASE` | `http://localhost:3000` | Origin of the Next app |

## Tools

| Tool | HTTP |
|------|------|
| `get_vendor_rating` | `GET /api/v1/vendors/:slug` |
| `search_vendors` | `GET /api/v1/vendors?q=&limit=` |
| `list_vendor_api_products` | `GET /api/v1/vendors/:slug/api-products` |
| `request_connection` | `POST /api/v1/connection-requests` |
| `get_vendor_ai_connectivity` | `GET /api/v1/vendors/:slug/ai-score` |

## Run

```bash
cd mcp-server
npm install
export MARKETPLACE_API_KEY=your-secret
npm run dev
```

For Cursor / Claude Desktop, add an MCP server config pointing to `node` with args `[ "path/to/mcp-server/dist/index.js" ]` after `npm run build`, or use `npx tsx path/to/mcp-server/src/index.ts` with env vars set.

## Build

```bash
npm run build && npm start
```
