"""Load and validate Source Signal vendor taxonomy."""

from __future__ import annotations

import json
from pathlib import Path

CATEGORIES_PATH = Path(__file__).resolve().parent / "categories.json"


def load_taxonomy(path: Path | None = None) -> dict[str, list[str]]:
    with open(path or CATEGORIES_PATH, encoding="utf-8") as f:
        return json.load(f)


def taxonomy_prompt_block(taxonomy: dict[str, list[str]]) -> str:
    lines = ["You MUST pick category and subcategory from this exact taxonomy:"]
    for category, subs in taxonomy.items():
        subs_str = ", ".join(f'"{s}"' for s in subs)
        lines.append(f'- category "{category}": subcategories [{subs_str}]')
    return "\n".join(lines)


def validate_classification(
    category: str | None,
    subcategory: str | None,
    taxonomy: dict[str, list[str]],
) -> tuple[str | None, str | None]:
    if not category or category not in taxonomy:
        return None, None
    subs = taxonomy[category]
    if subcategory and subcategory in subs:
        return category, subcategory
    return category, None
