# Source Signal — Growth workflows

Executable playbooks for vendor acquisition and user growth. Each folder is a self-contained workflow you can run on a schedule.

| Workflow | When to run | Time per run |
|----------|-------------|--------------|
| [vendor-outreach](./vendor-outreach/RUNBOOK.md) | Weekly (Mon) | ~2–3 hours |
| [content](./content/RUNBOOK.md) | Weekly (Sat batch) | ~2–4 hours |

## Quick start

**Week 1 (do both once):**

1. Open [vendor-outreach/RUNBOOK.md](./vendor-outreach/RUNBOOK.md) → complete **Run 001**.
2. Open [content/RUNBOOK.md](./content/RUNBOOK.md) → complete **Pieces 1 and 3**.

## Assets these workflows use

| Asset | Path |
|-------|------|
| Company claim | `/companies/[slug]/claim` |
| Sell form (inbound) | `/marketplace/sell` |
| Census tester (content CTA) | `/marketplace/census-data-api/help` |
| Marketplace | `/marketplace` |
| Write review | `/companies/[slug]/review` |
| Product architecture | [docs/PRODUCT_AND_ARCHITECTURE.md](../docs/PRODUCT_AND_ARCHITECTURE.md) |

## Tracking

- Vendor outreach: [vendor-outreach/target-list.csv](./vendor-outreach/target-list.csv)
- Content: [content/published-log.csv](./content/published-log.csv)
