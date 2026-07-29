# Vendor outreach — email templates

Replace `{placeholders}`. Send plain text. One primary link per email.

**Base URL:** set `BASE=https://your-domain.com` (or `http://localhost:3000` for testing).

---

## Email 1 — First touch (profile exists, unclaimed)

**Subject:** Your {Company} profile on Source Signal — free to claim

**When:** First contact, profile already live.

```
Hi {FirstName},

We listed {Company} on Source Signal — a directory and marketplace for data API providers (reviews, API discovery, and AI-agent connectivity).

Your profile is live but unclaimed:
{BASE}/companies/{slug}

Claiming is free (~2 minutes, verify with your @{domain} email). You can:
- Edit your description and API details
- Respond to reviews
- Get a marketplace listing with a live API try-it page (we did this for U.S. Census Bureau and WattBuy)

We also index vendors for AI agents via MCP, so agents can look up your ratings and find your API.

Worth 5 minutes?
{BASE}/companies/{slug}/claim

{YourName}
Source Signal
```

---

## Email 2 — Follow-up (Day 5)

**Subject:** Re: {Company} on Source Signal

**When:** No reply 5 days after Email 1.

```
Hi {FirstName},

Quick follow-up — we built a live API demo page for the U.S. Census Bureau that lets developers run queries without leaving our site. Happy to do the same for {Company} if you have public docs or an OpenAPI spec.

No cost, no exclusivity. We just want accurate listings and are happy to send developer traffic your way.

Profile: {BASE}/companies/{slug}

{YourName}
```

---

## Email 3 — After claim or positive reply

**Subject:** Next steps for {Company} on Source Signal

**When:** They claimed or replied interested.

```
Hi {FirstName},

Thanks for claiming {Company}. Three quick wins:

1. Reviews — ask 2–3 customers: {BASE}/companies/{slug}/review
2. Marketplace — we can publish you under topics like {Topic1}, {Topic2}: {BASE}/marketplace
3. MCP — we'll add your API to our agent tools so Claude/Cursor users can discover you

Which matters most to you right now?

{YourName}
```

---

## LinkedIn DM (same day as Email 1)

**Connection note (300 char limit):**

```
Building a review directory for data APIs — listed {Company}. Would love to connect. Happy to send claim link if useful.
```

**After accept:**

```
Thanks for connecting. Your unclaimed profile: {BASE}/companies/{slug}/claim — free to edit and add API details. No pitch deck, just trying to catalog data vendors properly.
```

---

## Inbound — Sell form reply (within 24h)

**Subject:** Re: Listing on Source Signal marketplace

```
Hi {FirstName},

Thanks for reaching out via our marketplace form. A few questions so we can set you up:

1. Do you have a public API with docs (URL)?
2. Free tier, pay-per-use, or contact-for-pricing?
3. Best email for domain verification to claim your company profile?

We'll create your directory entry and send a claim link.

{YourName}
Source Signal
```
