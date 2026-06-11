"""The Guardian Open Platform API."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)

TIMEOUT = 12


def search_guardian(query: str, time_range: str = "7d") -> list[dict]:
    key = get_settings().guardian_api_key.strip()
    if not key:
        raise ValueError("GUARDIAN_API_KEY not configured")

    days = {"24h": 1, "7d": 7, "30d": 30}.get(time_range, 7)
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    cache_key = f"guardian_{query}_{from_date}"

    def fetch() -> list[dict]:
        try:
            params = {
                "q": query,
                "from-date": from_date,
                "order-by": "newest",
                "page-size": "20",
                "show-fields": "trailText,byline,thumbnail",
                "api-key": key,
            }
            resp = requests.get(
                "https://content.guardianapis.com/search",
                params=params,
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            out = []
            for article in resp.json().get("response", {}).get("results", []):
                web_url = article.get("webUrl")
                title = (article.get("webTitle") or "").strip()
                if not web_url or not title:
                    continue
                fields = article.get("fields") or {}
                trail = (fields.get("trailText") or "").strip()
                row = build_result(
                    id=f"guardian_{str(article.get('id', '')).replace('/', '_')}",
                    platform="guardian",
                    author=fields.get("byline") or "The Guardian",
                    title=title,
                    content=trail or title,
                    source_url=web_url,
                    source_label=f"theguardian.com · {article.get('sectionName', 'News')}",
                    query=query,
                    publication="The Guardian",
                    image_url=fields.get("thumbnail"),
                    posted_at=article.get("webPublicationDate"),
                    sentiment_text=f"{title} {trail}",
                )
                if row:
                    out.append(row)
            log_platform_success("Guardian", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Guardian", query, exc)
            return []

    return cached(cache_key, fetch)
