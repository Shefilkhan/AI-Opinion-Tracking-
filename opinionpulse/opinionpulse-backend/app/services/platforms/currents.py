"""Currents API news search."""

from __future__ import annotations

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


def search_currents(query: str, time_range: str = "24h") -> list[dict]:
    key = get_settings().currents_api_key.strip()
    if not key:
        raise ValueError("CURRENTS_API_KEY not configured")

    cache_key = f"currents_{query}"

    def fetch() -> list[dict]:
        try:
            params = {"keywords": query, "language": "en", "apiKey": key}
            resp = requests.get(
                "https://api.currentsapi.services/v1/search",
                params=params,
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            out = []
            for article in resp.json().get("news") or []:
                article_url = article.get("url")
                title = (article.get("title") or "").strip()
                if not article_url or not title:
                    continue
                desc = (article.get("description") or "").strip()
                try:
                    domain = urlparse(article_url).hostname.replace("www.", "") or "news"
                except Exception:
                    domain = "news"
                row = build_result(
                    id=f"currents_{article.get('id', hash(article_url) & 0xFFFFFF)}",
                    platform="news",
                    author=article.get("author") or domain,
                    title=title,
                    content=desc or title,
                    source_url=article_url,
                    source_label=domain,
                    query=query,
                    publication=domain,
                    image_url=article.get("image"),
                    posted_at=article.get("published"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            log_platform_success("Currents", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Currents", query, exc)
            return []

    return cached(cache_key, fetch)
