"""Wikipedia REST summary API (no key required)."""

from __future__ import annotations

import logging

import requests

from app.services.cache_utils import cached

logger = logging.getLogger(__name__)
TIMEOUT = 10


def get_wikipedia_summary(query: str) -> dict | None:
    cache_key = f"wikipedia_{query.lower()}"

    def fetch() -> dict | None:
        try:
            title = query.strip().replace(" ", "_")
            resp = requests.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}",
                headers={"Accept": "application/json"},
                timeout=TIMEOUT,
            )
            if not resp.ok:
                print(f"❌ Wikipedia: no summary for '{query}' ({resp.status_code})")
                return None
            data = resp.json()
            if data.get("type") == "disambiguation":
                return None
            extract = (data.get("extract") or "").strip()
            if not extract:
                return None
            page_url = (
                data.get("content_urls", {})
                .get("desktop", {})
                .get("page")
                or f"https://en.wikipedia.org/wiki/{title}"
            )
            summary = {
                "title": data.get("title") or query,
                "summary": extract[:400],
                "url": page_url,
                "thumbnail": (data.get("thumbnail") or {}).get("source"),
            }
            print(f"✅ Wikipedia: summary found for '{query}'")
            return summary
        except Exception as exc:
            print(f"❌ Wikipedia: {exc}")
            logger.error("Wikipedia summary failed: %s", exc)
            return None

    return cached(cache_key, fetch, ttl_seconds=3600)
