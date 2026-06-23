"""Merge latest/trending headlines from all configured news APIs."""

from __future__ import annotations

import asyncio
from typing import Any

from app.core.config import get_settings
from app.services.platforms.currents import get_trending_currents
from app.services.platforms.gnews import get_trending_gnews
from app.services.platforms.guardian import get_trending_guardian
from app.services.platforms.mediastack import get_trending_mediastack
from app.services.platforms.news_api import get_trending_news
from app.services.platforms.platform_common import deduplicate_results
from app.services.platforms.query_helpers import sort_results_by_posted_at


def _configured_trending_fetchers(limit: int) -> list[tuple[str, Any]]:
    s = get_settings()
    fetchers: list[tuple[str, Any]] = []
    if s.news_api_key.strip():
        fetchers.append(("newsapi", lambda: get_trending_news()))
    if s.gnews_api_key.strip():
        fetchers.append(("gnews", lambda: get_trending_gnews(limit)))
    if s.guardian_api_key.strip():
        fetchers.append(("guardian", lambda: get_trending_guardian(limit)))
    if s.currents_api_key.strip():
        fetchers.append(("currents", lambda: get_trending_currents(limit)))
    if s.mediastack_api_key.strip():
        fetchers.append(("mediastack", lambda: get_trending_mediastack(limit)))
    return fetchers


def get_all_trending_news(limit: int = 30) -> list[dict]:
    """Pull freshest headlines from every configured news provider."""
    per_source = max(8, limit // max(len(_configured_trending_fetchers(limit)), 1))
    combined: list[dict] = []
    seen_urls: set[str] = set()

    for _name, fn in _configured_trending_fetchers(limit):
        try:
            rows = fn()
        except Exception:
            continue
        for row in rows[:per_source]:
            url = row.get("source_url") or row.get("url")
            if url and url in seen_urls:
                continue
            if url:
                seen_urls.add(url)
            combined.append(row)

    combined = deduplicate_results(combined)
    combined = sort_results_by_posted_at(combined)
    return combined[:limit]


async def get_all_trending_news_async(limit: int = 30) -> list[dict]:
    fetchers = _configured_trending_fetchers(limit)
    if not fetchers:
        return []

    per_source = max(8, limit // len(fetchers))

    async def fetch_one(_name: str, fn: Any) -> list[dict]:
        try:
            return (await asyncio.to_thread(fn))[:per_source]
        except Exception:
            return []

    batches = await asyncio.gather(
        *[fetch_one(name, fn) for name, fn in fetchers]
    )
    combined: list[dict] = []
    for batch in batches:
        combined.extend(batch)
    combined = deduplicate_results(combined)
    combined = sort_results_by_posted_at(combined)
    return combined[:limit]
