#!/usr/bin/env python3
"""
Scrape vendor URLs from a CSV, extract page text + image, classify via LLM.

Usage:
  cd scripts/vendor-scraper
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  export OPENAI_API_KEY=sk-...   # or GROQ_API_KEY / GEMINI_API_KEY
  python scrape.py --input links.csv --output results.csv

Input CSV: must have a url column (also accepts website, link, docs_url).
Optional columns: name, company_name.
"""

from __future__ import annotations

import argparse
import csv
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

from extract import fetch_and_extract
from llm import LLMError, enrich_with_llm, get_llm
from taxonomy import load_taxonomy

URL_COLUMNS = ("url", "website", "link", "docs_url", "homepage")
NAME_COLUMNS = ("name", "company_name", "company")


def find_column(fieldnames: list[str] | None, candidates: tuple[str, ...]) -> str | None:
    if not fieldnames:
        return None
    lower_map = {f.lower().strip(): f for f in fieldnames}
    for c in candidates:
        if c in lower_map:
            return lower_map[c]
    return None


def load_input_rows(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        url_col = find_column(reader.fieldnames, URL_COLUMNS)
        if not url_col:
            raise SystemExit(
                f"Input CSV must include one of: {', '.join(URL_COLUMNS)}. "
                f"Found columns: {reader.fieldnames}"
            )
        name_col = find_column(reader.fieldnames, NAME_COLUMNS)
        rows: list[dict[str, str]] = []
        for i, row in enumerate(reader, start=2):
            url = (row.get(url_col) or "").strip()
            if not url:
                continue
            name = (row.get(name_col) or "").strip() if name_col else ""
            rows.append({"url": url, "name": name, "_source_row": str(i)})
        return rows


OUTPUT_FIELDS = [
    "url",
    "final_url",
    "name",
    "description",
    "category",
    "subcategory",
    "image_url",
    "image_source",
    "page_title",
    "meta_description",
    "http_status",
    "status",
    "error",
    "llm_provider",
]


def run(args: argparse.Namespace) -> int:
    repo_root = Path(__file__).resolve().parents[2]
    load_dotenv(repo_root / ".env.local")
    load_dotenv(repo_root / ".env")

    taxonomy = load_taxonomy(args.categories)
    try:
        llm = get_llm(args.provider)
    except LLMError as exc:
        print(f"LLM setup error: {exc}", file=sys.stderr)
        return 1

    input_rows = load_input_rows(args.input)
    if not input_rows:
        print("No URLs found in input CSV.", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, str]] = []

    print(f"Processing {len(input_rows)} URL(s) with provider={args.provider}")

    for idx, row in enumerate(input_rows, start=1):
        url = row["url"]
        hint_name = row.get("name") or None
        print(f"[{idx}/{len(input_rows)}] {url}")

        out: dict[str, str] = {k: "" for k in OUTPUT_FIELDS}
        out["url"] = url
        out["llm_provider"] = args.provider

        page = fetch_and_extract(url, timeout=args.timeout)
        out["final_url"] = page.final_url
        out["page_title"] = page.title or ""
        out["meta_description"] = page.meta_description or ""
        out["http_status"] = str(page.status_code)
        out["image_url"] = page.image_url or ""
        out["image_source"] = page.image_source

        if page.fetch_error:
            out["status"] = "fetch_failed"
            out["error"] = page.fetch_error
            results.append(out)
            if args.delay:
                time.sleep(args.delay)
            continue

        if not page.body_text.strip():
            out["status"] = "fetch_failed"
            out["error"] = "No extractable text on page"
            results.append(out)
            if args.delay:
                time.sleep(args.delay)
            continue

        try:
            enriched = enrich_with_llm(llm, page, hint_name, taxonomy)
            out["name"] = enriched["name"]
            out["description"] = enriched["description"]
            out["category"] = enriched["category"] or ""
            out["subcategory"] = enriched["subcategory"] or ""
            if enriched["category"] is None:
                out["error"] = (
                    f"LLM returned invalid taxonomy: "
                    f"{enriched['llm_raw_category']!r} / {enriched['llm_raw_subcategory']!r}"
                )
                out["status"] = "partial"
            else:
                out["status"] = "ok"
        except LLMError as exc:
            out["status"] = "llm_failed"
            out["error"] = str(exc)

        results.append(out)
        if args.delay and idx < len(input_rows):
            time.sleep(args.delay)

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    ok = sum(1 for r in results if r["status"] == "ok")
    print(f"Done. Wrote {len(results)} rows to {args.output} ({ok} ok)")
    return 0 if ok == len(results) else 2


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape vendor pages and classify with LLM")
    parser.add_argument("--input", "-i", type=Path, required=True, help="Input CSV path")
    parser.add_argument("--output", "-o", type=Path, required=True, help="Output CSV path")
    parser.add_argument(
        "--provider",
        "-p",
        choices=("openai", "groq", "gemini"),
        default="openai",
        help="LLM provider (default: openai / gpt-4o-mini)",
    )
    parser.add_argument(
        "--categories",
        type=Path,
        default=Path(__file__).resolve().parent / "categories.json",
        help="Taxonomy JSON (keep in sync with lib/categories.ts)",
    )
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between requests")
    parser.add_argument("--timeout", type=float, default=25.0, help="HTTP timeout per page")
    args = parser.parse_args()
    raise SystemExit(run(args))


if __name__ == "__main__":
    main()
