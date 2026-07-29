#!/usr/bin/env python3
"""
Re-fetch logo/image URLs from an existing scraper CSV without calling the LLM.

Updates image_url, image_source, final_url, and http_status. All other columns
(name, description, category, etc.) are preserved from the input file.

Usage:
  python refresh_images.py -i results.csv -o results.updated.csv
  python refresh_images.py -i results.csv -o results.csv   # overwrite in place
"""

from __future__ import annotations

import argparse
import csv
import sys
import time
from pathlib import Path

from extract import fetch_images_only

URL_COLUMNS = ("final_url", "url", "website", "link", "docs_url", "homepage")


def find_column(fieldnames: list[str] | None, candidates: tuple[str, ...]) -> str | None:
    if not fieldnames:
        return None
    lower_map = {f.lower().strip(): f for f in fieldnames}
    for c in candidates:
        if c in lower_map:
            return lower_map[c]
    return None


def run(args: argparse.Namespace) -> int:
    with open(args.input, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    if not rows:
        print("Input CSV is empty.", file=sys.stderr)
        return 1

    url_col = find_column(fieldnames, URL_COLUMNS)
    if not url_col:
        raise SystemExit(
            f"CSV must include one of: {', '.join(URL_COLUMNS)}. Found: {fieldnames}"
        )

    for col in ("image_url", "image_source", "final_url", "http_status"):
        if col not in fieldnames:
            fieldnames.append(col)

    print(f"Refreshing images for {len(rows)} row(s) from {args.input}")

    updated = 0
    failed = 0

    for idx, row in enumerate(rows, start=1):
        fetch_url = (row.get("final_url") or row.get(url_col) or "").strip()
        if not fetch_url:
            print(f"[{idx}/{len(rows)}] skip — no URL")
            continue

        label = row.get("name") or fetch_url
        print(f"[{idx}/{len(rows)}] {label}")

        result = fetch_images_only(fetch_url, timeout=args.timeout)

        row["final_url"] = result.final_url
        row["http_status"] = str(result.status_code)

        if result.fetch_error:
            prev_error = row.get("error", "")
            row["error"] = f"image refresh: {result.fetch_error}"
            if row.get("status") == "ok":
                row["status"] = "image_fetch_failed"
            failed += 1
            print(f"  fetch failed: {result.fetch_error}")
        elif result.image_url:
            row["image_url"] = result.image_url
            row["image_source"] = result.image_source
            if prev_error := row.get("error", ""):
                if prev_error.startswith("image refresh:"):
                    row["error"] = ""
            if row.get("status") == "image_fetch_failed":
                row["status"] = "ok"
            updated += 1
            print(f"  → {result.image_source}: {result.image_url}")
        else:
            row["image_url"] = ""
            row["image_source"] = "none"
            print("  → no image found")

        if args.delay and idx < len(rows):
            time.sleep(args.delay)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Done. {updated} image(s) updated, {failed} fetch failure(s). Wrote {args.output}")
    return 0 if failed == 0 else 2


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Re-fetch og/favicon/header images from existing scraper CSV (no LLM)"
    )
    parser.add_argument("--input", "-i", type=Path, required=True, help="Existing results CSV")
    parser.add_argument("--output", "-o", type=Path, required=True, help="Output CSV path")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between requests")
    parser.add_argument("--timeout", type=float, default=25.0, help="HTTP timeout per page")
    args = parser.parse_args()
    raise SystemExit(run(args))


if __name__ == "__main__":
    main()
