"""LLM providers for vendor summarization and classification."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from typing import Any

from taxonomy import taxonomy_prompt_block, validate_classification


class LLMError(RuntimeError):
    pass


class BaseLLM(ABC):
    @abstractmethod
    def classify_vendor(
        self,
        *,
        url: str,
        page_title: str | None,
        meta_description: str | None,
        body_text: str,
        hint_name: str | None,
        taxonomy: dict[str, list[str]],
    ) -> dict[str, Any]:
        ...


def _build_prompt(
    *,
    url: str,
    page_title: str | None,
    meta_description: str | None,
    body_text: str,
    hint_name: str | None,
    taxonomy: dict[str, list[str]],
) -> str:
    name_line = f"Known name hint: {hint_name}\n" if hint_name else ""
    return f"""You analyze data vendor / API provider websites for a B2B data marketplace directory.

{taxonomy_prompt_block(taxonomy)}

Return ONLY valid JSON with these keys:
- "name": company or product name (string)
- "description": 2-4 sentences summarizing what data/service they offer and who it's for (string, no markdown)
- "category": exact category string from taxonomy (string)
- "subcategory": exact subcategory string for that category (string)

URL: {url}
{name_line}Page title: {page_title or "(none)"}
Meta description: {meta_description or "(none)"}

Page text (may be truncated):
---
{body_text[:8000]}
---
"""


def _parse_llm_json(raw: str) -> dict[str, Any]:
    raw = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if fence:
        raw = fence.group(1).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Model did not return valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise LLMError("Model JSON must be an object")
    return data


class OpenAILLM(BaseLLM):
    def __init__(self, model: str | None = None) -> None:
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        if not self.api_key:
            raise LLMError("OPENAI_API_KEY is not set")
        self.model = model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    def classify_vendor(
        self,
        *,
        url: str,
        page_title: str | None,
        meta_description: str | None,
        body_text: str,
        hint_name: str | None,
        taxonomy: dict[str, list[str]],
    ) -> dict[str, Any]:
        prompt = _build_prompt(
            url=url,
            page_title=page_title,
            meta_description=meta_description,
            body_text=body_text,
            hint_name=hint_name,
            taxonomy=taxonomy,
        )
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You classify data vendors. Respond with JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise LLMError(f"OpenAI API error {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise LLMError(f"OpenAI request failed: {exc}") from exc

        content = body["choices"][0]["message"]["content"]
        return _parse_llm_json(content)


class GroqLLM(BaseLLM):
    """Free-tier friendly; uses Groq's OpenAI-compatible API."""

    def __init__(self, model: str | None = None) -> None:
        self.api_key = os.environ.get("GROQ_API_KEY", "")
        if not self.api_key:
            raise LLMError("GROQ_API_KEY is not set")
        self.model = model or os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

    def classify_vendor(
        self,
        *,
        url: str,
        page_title: str | None,
        meta_description: str | None,
        body_text: str,
        hint_name: str | None,
        taxonomy: dict[str, list[str]],
    ) -> dict[str, Any]:
        prompt = _build_prompt(
            url=url,
            page_title=page_title,
            meta_description=meta_description,
            body_text=body_text,
            hint_name=hint_name,
            taxonomy=taxonomy,
        )
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You classify data vendors. Respond with JSON only, no markdown fences.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise LLMError(f"Groq API error {exc.code}: {detail}") from exc

        content = body["choices"][0]["message"]["content"]
        return _parse_llm_json(content)


class GeminiLLM(BaseLLM):
    """Google Gemini — generous free tier on Flash models."""

    def __init__(self, model: str | None = None) -> None:
        self.api_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
        if not self.api_key:
            raise LLMError("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set")
        self.model = model or os.environ.get("GEMINI_MODEL", "gemini-2.0-flash-lite")

    def classify_vendor(
        self,
        *,
        url: str,
        page_title: str | None,
        meta_description: str | None,
        body_text: str,
        hint_name: str | None,
        taxonomy: dict[str, list[str]],
    ) -> dict[str, Any]:
        prompt = _build_prompt(
            url=url,
            page_title=page_title,
            meta_description=meta_description,
            body_text=body_text,
            hint_name=hint_name,
            taxonomy=taxonomy,
        )
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise LLMError(f"Gemini API error {exc.code}: {detail}") from exc

        try:
            text = body["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            raise LLMError(f"Unexpected Gemini response: {body}") from exc
        return _parse_llm_json(text)


def get_llm(provider: str) -> BaseLLM:
    provider = provider.lower()
    if provider == "openai":
        return OpenAILLM()
    if provider == "groq":
        return GroqLLM()
    if provider == "gemini":
        return GeminiLLM()
    raise LLMError(f"Unknown provider: {provider}. Use openai, groq, or gemini.")


def enrich_with_llm(
    llm: BaseLLM,
    page: Any,
    hint_name: str | None,
    taxonomy: dict[str, list[str]],
) -> dict[str, Any]:
    raw = llm.classify_vendor(
        url=page.final_url or page.url,
        page_title=page.title,
        meta_description=page.meta_description,
        body_text=page.body_text,
        hint_name=hint_name,
        taxonomy=taxonomy,
    )
    category, subcategory = validate_classification(
        str(raw.get("category", "")).strip() or None,
        str(raw.get("subcategory", "")).strip() or None,
        taxonomy,
    )
    return {
        "name": (str(raw.get("name", "")).strip() or hint_name or page.title or ""),
        "description": str(raw.get("description", "")).strip(),
        "category": category,
        "subcategory": subcategory,
        "llm_raw_category": raw.get("category"),
        "llm_raw_subcategory": raw.get("subcategory"),
    }
