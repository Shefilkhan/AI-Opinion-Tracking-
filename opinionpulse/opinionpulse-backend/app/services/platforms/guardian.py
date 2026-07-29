"""The Guardian Open Platform API."""

from __future__ import annotations

from datetime import datetime, timezone

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    filter_headline_results,
    iso_date_days_ago,
    iso_datetime_cutoff,
    make_search_cache_key,
    quoted_phrase_query,
    sort_results_by_posted_at,
)

TIMEOUT = 12
NEWS_CACHE_TTL = 180


def search_guardian(query: str, time_range: str = "7d") -> list[dict]:
    key = get_settings().guardian_api_key.strip()
    if not key:
        raise ValueError("GUARDIAN_API_KEY not configured")

    cache_key = make_search_cache_key("guardian", query, time_range)

    def fetch() -> list[dict]:
        try:
            from_date = iso_date_days_ago(time_range)
            to_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            params = {
                "q": quoted_phrase_query(query),
                "order-by": "newest",
                "page-size": "20",
                "from-date": from_date,
                "to-date": to_date,
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
            out = filter_headline_results(out, query, fallback_to_all=False)
            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("Guardian", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Guardian", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=60)


def get_trending_guardian(limit: int = 10) -> list[dict]:
    key = get_settings().guardian_api_key.strip()
    if not key:
        return []
    cache_key = f"guardian_trending_{limit}"

    def fetch() -> list[dict]:
        try:
            params = {
                "order-by": "newest",
                "page-size": str(limit),
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
                    query="trending",
                    publication="The Guardian",
                    image_url=fields.get("thumbnail"),
                    posted_at=article.get("webPublicationDate"),
                    sentiment_text=f"{title} {trail}",
                )
                if row:
                    out.append(row)
            return sort_results_by_posted_at(out)
        except Exception as exc:
            log_platform_error("Guardian", "trending", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=60)
