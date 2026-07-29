# Vendor page scraper

Reads URLs from a CSV, fetches each page, extracts text and a best-effort logo/image, and uses an LLM to produce a **description**, **category**, and **subcategory** aligned with `lib/categories.ts`.

## Setup

```bash
cd scripts/vendor-scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

API keys are loaded from the repo root `.env.local` (same as the Next.js app).

## Input CSV

Required column (any one of): `url`, `website`, `link`, `docs_url`, `homepage`

Optional: `name` or `company_name`

See `input.example.csv`.

## Run

**OpenAI (default, cheapest paid — `gpt-4o-mini`, same as AI search):**

```bash
python scrape.py -i input.example.csv -o results.csv
```

**Groq (free tier):**

```bash
export GROQ_API_KEY=gsk_...
python scrape.py -i links.csv -o results.csv --provider groq
```

**Google Gemini (free tier on Flash Lite):**

```bash
export GEMINI_API_KEY=...
python scrape.py -i links.csv -o results.csv --provider gemini
```

## Output columns

| Column | Description |
|--------|-------------|
| `url` | Input URL |
| `final_url` | URL after redirects |
| `name` | LLM-inferred vendor name |
| `description` | 2–4 sentence service summary |
| `category` / `subcategory` | From app taxonomy |
| `image_url` | Best image found |
| `image_source` | `og`, `twitter`, `favicon`, `header`, or `none` |
| `status` | `ok`, `partial`, `fetch_failed`, `llm_failed` |
| `error` | Error detail when applicable |

## Image priority

1. `og:image` (or `twitter:image`)
2. Favicon / apple-touch-icon
3. First logo/hero/header image in the page

## Taxonomy

Categories live in `categories.json`. When you change `lib/categories.ts`, update this file to match.

## Notes

- Static HTML only (no headless browser). JS-heavy SPAs may return little text.
- Be polite: default 1s delay between requests (`--delay 0` to disable).
- Invalid LLM taxonomy picks are marked `partial` with empty category fields.
