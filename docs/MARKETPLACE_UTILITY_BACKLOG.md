# Marketplace utility backlog

Prioritized improvements to make Source Signal more useful for buyers, vendors, and AI clients. **Next milestone (recommended):** pick **one discovery** item and **one commercial/trust** item so shipping stays focused.

## P0 — Highest leverage

1. **Public data atlas (MVP)**  
   - Seed and surface `public.datasets` (browse page, link from vendor profiles, filters).  
   - Unlocks the “atlas of public data” product line and gives MCP `search`/`datasets` real data later.

2. **RFQ / connection follow-through**  
   - When `connection_requests` rows are created (web or `/api/v1`), notify vendor email (Resend) and show status in dashboard.  
   - Turns the marketplace stub into a measurable funnel.

## P1 — Strong second wave

3. **Vendor API registry UI**  
   - Claimed vendors can add/edit `api_products` in the dashboard (today: API-only via `POST /api/v1/api-products`).  
   - Feeds MCP `list_vendor_api_products` and future connect flows.

4. **Compare vendors**  
   - Side-by-side page: category, delivery methods, review dimension averages, latest AI score.

5. **Saved searches and alerts**  
   - Persist AI search criteria + email when new vendors match (batch or weekly).

## P2 — Depth and scale

6. **Pricing / packaging hints** (even if “contact for pricing”)  
7. **Sample data requests** (gated download or signed URL workflow)  
8. **API status / changelog** for registered products  
9. **Review moderation UI** (use `reviews.hidden` from an admin role)  
10. **Vendor responses** to reviews (claimed accounts)  
11. **SEO**: sitemaps, JSON-LD for `Organization` + `Review`

## AI / MCP alignment

- After real **AI connectivity probes** replace the stub, expose methodology and raw metric summaries on the vendor page and in `get_vendor_ai_connectivity`.  
- Add rate limits and audit logs for machine clients (`external_api_clients` when per-key auth ships).
