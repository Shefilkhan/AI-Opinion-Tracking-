"""GNews API."""

from __future__ import annotations

import base64
from urllib.parse import urlparse

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)

TIMEOUT = 12


def search_gnews(query: str, time_range: str = "24h") -> list[dict]:
    key = get_settings().gnews_api_key.strip()
    if not key:
        raise ValueError("GNEWS_API_KEY not configured")

    cache_key = f"gnews_{query}"

    def fetch() -> list[dict]:
        try:
            params = {"q": query, "lang": "en", "max": "10", "token": key}
            resp = requests.get(
                "https://gnews.io/api/v4/search", params=params, timeout=TIMEOUT
            )
            resp.raise_for_status()
            out = []
            for article in resp.json().get("articles") or []:
                article_url = article.get("url")
                title = (article.get("title") or "").strip()
                if not article_url or not title:
                    continue
                desc = (article.get("description") or "").strip()
                try:
                    domain = urlparse(article_url).hostname.replace("www.", "") or "news"
                except Exception:
                    domain = article.get("source", {}).get("name") or "news"
                aid = base64.urlsafe_b64encode(article_url.encode()).decode()[:10]
                row = build_result(
                    id=f"gnews_{aid}",
                    platform="news",
                    author=article.get("source", {}).get("name") or domain,
                    title=title,
                    content=desc or title,
                    source_url=article_url,
                    source_label=domain,
                    query=query,
                    publication=article.get("source", {}).get("name") or domain,
                    image_url=article.get("image"),
                    posted_at=article.get("publishedAt"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            log_platform_success("GNews", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("GNews", query, exc)
            return []

    return cached(cache_key, fetch)
