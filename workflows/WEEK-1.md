# Week 1 — start here

One week to launch both growth workflows. ~6–8 hours total.

---

## Monday — Vendor outreach Run 001 (~2.5 h)

Follow [vendor-outreach/RUNBOOK.md](./vendor-outreach/RUNBOOK.md).

- [ ] Copy `vendor-outreach/target-list.csv` → `target-list-2026-07-28.csv` (use today's date)
- [ ] Pick **10 vendors** from [public-apis](https://github.com/public-apis/public-apis) → Government or Weather category
- [ ] Create missing `companies` rows in Supabase (or note slugs if already exist)
- [ ] Send Email 1 from [email-templates.md](./vendor-outreach/email-templates.md)
- [ ] Log in CSV + Run log table in RUNBOOK

**Done when:** 10 rows `status=emailed`.

---

## Saturday — Content batch (~3 h)

Follow [content/RUNBOOK.md](./content/RUNBOOK.md).

- [ ] Piece **#1** — Poverty rate in your city ([calendar](./content/calendar.md))
- [ ] Piece **#3** — Census tester full demo
- [ ] Use [production-checklist.md](./content/production-checklist.md) for each
- [ ] Log in [published-log.csv](./content/published-log.csv)

**Done when:** 2 YouTube Shorts + 2 X threads live.

---

## Optional — same week

- [ ] Set `BASE=https://your-domain.com` in email templates
- [ ] Check `/marketplace/sell` inquiries in Supabase
- [ ] Bookmark Census tester for screen recordings

---

## Next week

| Day | Action |
|-----|--------|
| Mon | Vendor Run 002 — 20 vendors + Email 2 for last week's batch |
| Sat | Content pieces **#5** and **#10** |
| Day 5 after Email 1 | Follow-up Email 2 (automated via CSV filter) |

---

## Folder map

```
workflows/
├── README.md
├── WEEK-1.md                 ← you are here
├── vendor-outreach/
│   ├── RUNBOOK.md            ← weekly vendor workflow
│   ├── email-templates.md
│   └── target-list.csv
└── content/
    ├── RUNBOOK.md            ← weekly content workflow
    ├── calendar.md
    ├── production-checklist.md
    └── published-log.csv
```
