"""Fetch pages and extract text + image candidates."""

from __future__ import annotations

import re
import struct
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

ImageSource = Literal["og", "twitter", "favicon", "header", "none"]

USER_AGENT = (
    "Mozilla/5.0 (compatible; SourceSignalVendorScraper/1.0; +https://sourcesignal.dev)"
)

BLOCK_TAGS = {"script", "style", "noscript", "svg", "path"}

SOURCE_PRIORITY: dict[str, int] = {
    "og": 0,
    "twitter": 1,
    "favicon": 2,
    "header": 3,
}


@dataclass
class ImageCandidate:
    url: str
    source: ImageSource
    width: int | None = None
    height: int | None = None
    order: int = 0

    @property
    def priority(self) -> int:
        return SOURCE_PRIORITY.get(self.source, 99)

    def aspect_distance(self) -> float:
        if not self.width or not self.height or self.width <= 0 or self.height <= 0:
            return float("inf")
        return abs(self.width / self.height - 1.0)


@dataclass
class PageExtract:
    url: str
    final_url: str
    status_code: int
    title: str | None
    meta_description: str | None
    body_text: str
    image_url: str | None
    image_source: ImageSource
    fetch_error: str | None = None


@dataclass
class ImageExtract:
    url: str
    final_url: str
    status_code: int
    image_url: str | None
    image_source: ImageSource
    fetch_error: str | None = None


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url:
        raise ValueError("empty url")
    if not urlparse(url).scheme:
        url = f"https://{url}"
    return url


def _meta_content(soup: BeautifulSoup, *keys: tuple[str, str]) -> str | None:
    for attr, value in keys:
        tag = soup.find("meta", attrs={attr: value})
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
    return None


def _meta_int(soup: BeautifulSoup, *keys: tuple[str, str]) -> int | None:
    raw = _meta_content(soup, *keys)
    if not raw:
        return None
    try:
        return int(float(raw.strip()))
    except ValueError:
        return None


def _resolve(base: str, href: str | None) -> str | None:
    if not href or not href.strip():
        return None
    href = href.strip()
    if href.startswith("data:"):
        return None
    return urljoin(base, href)


def _parse_int_attr(value: object) -> int | None:
    if value is None:
        return None
    try:
        n = int(str(value).strip())
        return n if n > 0 else None
    except ValueError:
        return None


def _dedupe_candidates(candidates: list[ImageCandidate]) -> list[ImageCandidate]:
    seen: set[str] = set()
    out: list[ImageCandidate] = []
    for c in candidates:
        if c.url in seen:
            continue
        seen.add(c.url)
        out.append(c)
    return out


def _collect_og_candidates(soup: BeautifulSoup, base_url: str, order: int) -> tuple[list[ImageCandidate], int]:
    candidates: list[ImageCandidate] = []
    og = _meta_content(soup, ("property", "og:image"), ("name", "og:image"))
    if og:
        url = _resolve(base_url, og)
        if url:
            w = _meta_int(soup, ("property", "og:image:width"), ("name", "og:image:width"))
            h = _meta_int(soup, ("property", "og:image:height"), ("name", "og:image:height"))
            candidates.append(ImageCandidate(url=url, source="og", width=w, height=h, order=order))
            order += 1

    twitter = _meta_content(
        soup,
        ("property", "twitter:image"),
        ("name", "twitter:image"),
        ("property", "twitter:image:src"),
    )
    if twitter:
        url = _resolve(base_url, twitter)
        if url:
            w = _meta_int(
                soup,
                ("property", "twitter:image:width"),
                ("name", "twitter:image:width"),
            )
            h = _meta_int(
                soup,
                ("property", "twitter:image:height"),
                ("name", "twitter:image:height"),
            )
            candidates.append(ImageCandidate(url=url, source="twitter", width=w, height=h, order=order))
            order += 1

    return candidates, order


def _collect_favicon_candidates(soup: BeautifulSoup, base_url: str, order: int) -> tuple[list[ImageCandidate], int]:
    candidates: list[ImageCandidate] = []
    for link in soup.find_all("link", rel=True):
        rel = " ".join(link.get("rel", [])).lower()
        if "icon" not in rel and "apple-touch-icon" not in rel:
            continue
        url = _resolve(base_url, link.get("href"))
        if not url:
            continue
        w: int | None = None
        h: int | None = None
        sizes = str(link.get("sizes", ""))
        if "x" in sizes:
            parts = sizes.lower().split("x")
            if len(parts) == 2:
                w = _parse_int_attr(parts[0])
                h = _parse_int_attr(parts[1])
        candidates.append(ImageCandidate(url=url, source="favicon", width=w, height=h, order=order))
        order += 1
    return candidates, order


def _collect_header_candidates(soup: BeautifulSoup, base_url: str, order: int) -> tuple[list[ImageCandidate], int]:
    candidates: list[ImageCandidate] = []
    selectors = [
        "header img",
        "[role='banner'] img",
        "nav img",
        ".header img",
        ".hero img",
        ".logo img",
        "img.logo",
        "img#logo",
        "img[alt*='logo' i]",
    ]
    seen_src: set[str] = set()
    for sel in selectors:
        for img in soup.select(sel):
            src = img.get("src") or img.get("data-src")
            url = _resolve(base_url, src)
            if not url or url in seen_src:
                continue
            seen_src.add(url)
            candidates.append(
                ImageCandidate(
                    url=url,
                    source="header",
                    width=_parse_int_attr(img.get("width")),
                    height=_parse_int_attr(img.get("height")),
                    order=order,
                )
            )
            order += 1

    for img in soup.find_all("img", limit=20):
        src = img.get("src") or img.get("data-src")
        url = _resolve(base_url, src)
        if not url or url in seen_src:
            continue
        seen_src.add(url)
        candidates.append(
            ImageCandidate(
                url=url,
                source="header",
                width=_parse_int_attr(img.get("width")),
                height=_parse_int_attr(img.get("height")),
                order=order,
            )
        )
        order += 1

    return candidates, order


def collect_image_candidates(soup: BeautifulSoup, base_url: str) -> list[ImageCandidate]:
    order = 0
    og, order = _collect_og_candidates(soup, base_url, order)
    fav, order = _collect_favicon_candidates(soup, base_url, order)
    hdr, order = _collect_header_candidates(soup, base_url, order)
    return _dedupe_candidates(og + fav + hdr)


def _probe_png(data: bytes) -> tuple[int | None, int | None]:
    if len(data) >= 24 and data[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", data[16:24])
        return w, h
    return None, None


def _probe_gif(data: bytes) -> tuple[int | None, int | None]:
    if len(data) >= 10 and data[:6] in (b"GIF87a", b"GIF89a"):
        w, h = struct.unpack("<HH", data[6:10])
        return w, h
    return None, None


def _probe_jpeg(data: bytes) -> tuple[int | None, int | None]:
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return None, None
    i = 2
    while i + 9 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", data[i + 5 : i + 9])
            return w, h
        if marker in (0xD8, 0xD9):
            break
        if i + 3 >= len(data):
            break
        seg_len = struct.unpack(">H", data[i + 2 : i + 4])[0]
        i += 2 + seg_len
    return None, None


def _probe_webp(data: bytes) -> tuple[int | None, int | None]:
    if len(data) < 30 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        return None, None
    chunk = data[12:16]
    if chunk == b"VP8 " and len(data) >= 30:
        w = struct.unpack("<H", data[26:28])[0] & 0x3FFF
        h = struct.unpack("<H", data[28:30])[0] & 0x3FFF
        return w or None, h or None
    if chunk == b"VP8L" and len(data) >= 25:
        bits = struct.unpack("<I", data[21:25])[0]
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if chunk == b"VP8X" and len(data) >= 30:
        w = 1 + int.from_bytes(data[24:27], "little")
        h = 1 + int.from_bytes(data[27:30], "little")
        return w, h
    return None, None


def probe_image_dimensions(client: httpx.Client, url: str, timeout: float = 10.0) -> tuple[int | None, int | None]:
    try:
        resp = client.get(url, timeout=timeout, follow_redirects=True)
        if resp.status_code >= 400:
            return None, None
        data = resp.content[:65536]
    except httpx.HTTPError:
        return None, None

    for probe in (_probe_png, _probe_gif, _probe_jpeg, _probe_webp):
        w, h = probe(data)
        if w and h:
            return w, h
    return None, None


def _fill_missing_dimensions(
    candidates: list[ImageCandidate], client: httpx.Client | None
) -> list[ImageCandidate]:
    if not client:
        return candidates
    filled: list[ImageCandidate] = []
    for c in candidates:
        if c.width and c.height:
            filled.append(c)
            continue
        w, h = probe_image_dimensions(client, c.url)
        filled.append(ImageCandidate(url=c.url, source=c.source, width=w, height=h, order=c.order))
    return filled


def pick_best_image(
    candidates: list[ImageCandidate], client: httpx.Client | None = None
) -> tuple[str | None, ImageSource]:
    if not candidates:
        return None, "none"

    enriched = _fill_missing_dimensions(candidates, client)
    best = min(enriched, key=lambda c: (c.aspect_distance(), c.priority, c.order))
    return best.url, best.source


def _visible_text(soup: BeautifulSoup, max_chars: int = 12_000) -> str:
    for tag in soup.find_all(BLOCK_TAGS):
        tag.decompose()

    chunks: list[str] = []
    for el in soup.find_all(string=True):
        text = str(el).strip()
        if not text or text.isspace():
            continue
        parent = el.parent.name if el.parent else ""
        if parent in BLOCK_TAGS:
            continue
        chunks.append(text)

    joined = re.sub(r"\s+", " ", " ".join(chunks)).strip()
    if len(joined) > max_chars:
        return joined[:max_chars] + "…"
    return joined


def _fetch_html(url: str, timeout: float) -> tuple[str | None, str, int, str | None]:
    url = normalize_url(url)
    try:
        with httpx.Client(
            follow_redirects=True,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
        ) as client:
            resp = client.get(url)
            final_url = str(resp.url)
            status = resp.status_code
            if resp.status_code >= 400:
                return None, final_url, status, f"HTTP {status}"
            content_type = resp.headers.get("content-type", "")
            if "html" not in content_type.lower():
                return None, final_url, status, f"Non-HTML content-type: {content_type}"
            return resp.text, final_url, status, None
    except httpx.HTTPError as exc:
        return None, url, 0, str(exc)


def fetch_images_only(url: str, timeout: float = 25.0) -> ImageExtract:
    """Re-fetch a page and pick the best square-ish logo/image (no LLM)."""
    url = normalize_url(url)
    html, final_url, status, err = _fetch_html(url, timeout)
    if err or not html:
        return ImageExtract(
            url=url,
            final_url=final_url,
            status_code=status,
            image_url=None,
            image_source="none",
            fetch_error=err,
        )

    soup = BeautifulSoup(html, "html.parser")
    candidates = collect_image_candidates(soup, final_url)

    with httpx.Client(
        follow_redirects=True,
        timeout=10.0,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        image_url, image_source = pick_best_image(candidates, client)

    return ImageExtract(
        url=url,
        final_url=final_url,
        status_code=status,
        image_url=image_url,
        image_source=image_source,
    )


def fetch_and_extract(url: str, timeout: float = 25.0) -> PageExtract:
    url = normalize_url(url)
    html, final_url, status, err = _fetch_html(url, timeout)
    if err or not html:
        return PageExtract(
            url=url,
            final_url=final_url,
            status_code=status,
            title=None,
            meta_description=None,
            body_text="",
            image_url=None,
            image_source="none",
            fetch_error=err,
        )

    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else None
    meta_desc = _meta_content(soup, ("name", "description"), ("property", "og:description"))
    body_text = _visible_text(soup)

    with httpx.Client(
        follow_redirects=True,
        timeout=10.0,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        image_url, image_source = pick_best_image(collect_image_candidates(soup, final_url), client)

    return PageExtract(
        url=url,
        final_url=final_url,
        status_code=status,
        title=title,
        meta_description=meta_desc,
        body_text=body_text,
        image_url=image_url,
        image_source=image_source,
    )
