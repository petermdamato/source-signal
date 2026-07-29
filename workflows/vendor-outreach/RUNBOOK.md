# Vendor outreach — weekly runbook

**Goal:** Add data vendors to Source Signal via unclaimed profiles + cold email → claim → marketplace.

**Cadence:** Every Monday (or 2×/week when discovery pipeline is live).

**Time budget:** 2–3 hours per run.

---

## Before you start

- [ ] App is deployed (or localhost) so claim links work
- [ ] Email sender ready (your domain or personal — avoid spam triggers)
- [ ] Hunter.io / Apollo / LinkedIn open for contact lookup
- [ ] Copy [target-list.csv](./target-list.csv) → `target-list-YYYY-MM-DD.csv` for this run

---

## Run checklist (repeat every week)

### Phase A — Build the batch (45 min)

**Target:** 20 vendors per run (start with 10 if solo).

- [ ] **A1.** Pick a source for this week (rotate):
  - [ ] [public-apis GitHub](https://github.com/public-apis/public-apis) — pick one category (Geography, Finance, Weather, Government)
  - [ ] [APIs.guru list](https://api.apis.guru/v2/list.json) — filter by tag/description containing "data", "geo", "finance"
  - [ ] Inbound from [vendor_interest_inquiries](https://sourcesignal.com/marketplace/sell) (check Supabase)
  - [ ] `discovered_vendors` staging table (when migration 020 is live)

- [ ] **A2.** For each vendor, fill one row in `target-list-YYYY-MM-DD.csv`:
  - Company name, website, docs URL, category
  - Contact name, email, LinkedIn (best available)
  - `company_slug` (after profile exists)

- [ ] **A3.** **Profile must exist before Email 1.** For each vendor:
  - [ ] Search `/companies?q=` — if missing, create company (Supabase or admin promote from staging)
  - [ ] Note slug: `us-census-bureau` style
  - [ ] Optional: add `api_products` row (name, base_url, docs_url, pricing_model: free/freemium/contact)

- [ ] **A4.** Skip if already in CSV with status `claimed` or `replied`

**Segment priority this week:**

1. API-first startups (ReadMe/Swagger docs, freemium)
2. Government / public data publishers
3. Mid-market brokers (only if you have buyer traffic)

---

### Phase B — Send outreach (30 min)

- [ ] **B1.** Use templates in [email-templates.md](./email-templates.md)
- [ ] **B2.** Send **Email 1** only to rows with status `new`
- [ ] **B3.** Update CSV: `status` → `emailed`, `email_1_date` → today
- [ ] **B4.** Optional same day: LinkedIn connection + one-line DM with claim link

**Do not** attach PDFs or use HTML-heavy templates — plain text, one link.

---

### Phase C — Follow-ups (20 min)

- [ ] **C1.** Filter CSV: `emailed` + `email_1_date` = 5 days ago → send **Email 2**
- [ ] **C2.** Update: `status` → `follow_up_1`, `email_2_date` → today
- [ ] **C3.** Any `replied` or `claimed` → send **Email 3** (personalized, not bulk)

---

### Phase D — Process inbound (15 min)

- [ ] **D1.** Check Supabase `vendor_interest_inquiries` — reply within 24h
- [ ] **D2.** Check `connection_requests` from marketplace — note vendor for outreach
- [ ] **D3.** Anyone who claimed → ask for 1 review + optional marketplace listing

---

### Phase E — Log & iterate (10 min)

- [ ] **E1.** Count: emailed / opened (if tracked) / replied / claimed
- [ ] **E2.** Merge `target-list-YYYY-MM-DD.csv` into master [target-list.csv](./target-list.csv)
- [ ] **E3.** Note one learning in **Run log** below

---

## Run log

| Run date | Sourced | Emailed | Replied | Claimed | Notes |
|----------|---------|---------|---------|---------|-------|
| | | | | | |

---

## Pitch cheat sheet (copy-paste)

**One-liner:** Source Signal is the review + marketplace directory for data APIs, with AI-agent discovery via MCP.

**What they get free:**
- Company profile (SEO, editable after claim)
- Customer reviews (5 dimensions)
- Optional marketplace listing + live API try-it page
- Listed for AI agents using our MCP server

**Claim URL:** `https://[YOUR_DOMAIN]/companies/{slug}/claim`

---

## When discovery pipeline is live

Replace manual **A1** with:

1. Review `discovered_vendors` where `status = pending` and `confidence_score >= 0.6`
2. Admin promote → `companies` + draft `api_products`
3. Continue from **B1** with claim link

---

## Related

- [email-templates.md](./email-templates.md)
- [target-list.csv](./target-list.csv)
- [../content/RUNBOOK.md](../content/RUNBOOK.md) — drives buyer traffic that makes vendor pitch stronger
