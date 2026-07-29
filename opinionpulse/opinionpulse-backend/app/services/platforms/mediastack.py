"""Mediastack news API."""

from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import urlparse

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
    quoted_phrase_query,
    sort_results_by_posted_at,
)

TIMEOUT = 12
NEWS_CACHE_TTL = 180


def _today_utc_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def search_mediastack(query: str, time_range: str = "24h") -> list[dict]:
    key = get_settings().mediastack_api_key.strip()
    if not key:
        raise ValueError("MEDIASTACK_API_KEY not configured")

    cache_key = f"mediastack_{query}_{time_range}"

    def fetch() -> list[dict]:
        try:
            params = {
                "access_key": key,
                "keywords": quoted_phrase_query(query),
                "languages": "en",
                "sort": "published_desc",
                "date": f"{iso_date_days_ago(time_range)},{_today_utc_date()}",
                "limit": 20,
            }
            resp = requests.get(
                "http://api.mediastack.com/v1/news", params=params, timeout=TIMEOUT
            )
            resp.raise_for_status()
            out = []
            for article in resp.json().get("data") or []:
                article_url = article.get("url")
                title = (article.get("title") or "").strip()
                if not article_url or not title:
                    continue
                desc = (article.get("description") or "").strip()
                try:
                    domain = urlparse(article_url).hostname.replace("www.", "") or "news"
                except Exception:
                    domain = article.get("source") or "news"
                row = build_result(
                    id=f"mediastack_{hash(article_url) & 0xFFFFFF}",
                    platform="news",
                    author=article.get("author") or article.get("source") or "News",
                    title=title,
                    content=desc or title,
                    source_url=article_url,
                    source_label=domain,
                    query=query,
                    publication=article.get("source") or domain,
                    image_url=article.get("image"),
                    posted_at=article.get("published_at"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            out = filter_headline_results(out, query, fallback_to_all=False)
            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("Mediastack", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Mediastack", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=NEWS_CACHE_TTL)


def get_trending_mediastack(limit: int = 10) -> list[dict]:
    key = get_settings().mediastack_api_key.strip()
    if not key:
        return []
    cache_key = f"mediastack_trending_{limit}"

    def fetch() -> list[dict]:
        try:
            params = {
                "access_key": key,
                "languages": "en",
                "sort": "published_desc",
                "limit": limit,
            }
            resp = requests.get(
                "http://api.mediastack.com/v1/news", params=params, timeout=TIMEOUT
            )
            resp.raise_for_status()
            out = []
            for article in resp.json().get("data") or []:
                article_url = article.get("url")
                title = (article.get("title") or "").strip()
                if not article_url or not title:
                    continue
                desc = (article.get("description") or "").strip()
                try:
                    domain = urlparse(article_url).hostname.replace("www.", "") or "news"
                except Exception:
                    domain = article.get("source") or "news"
                row = build_result(
                    id=f"mediastack_{hash(article_url) & 0xFFFFFF}",
                    platform="news",
                    author=article.get("author") or article.get("source") or "News",
                    title=title,
                    content=desc or title,
                    source_url=article_url,
                    source_label=domain,
                    query="trending",
                    publication=article.get("source") or domain,
                    image_url=article.get("image"),
                    posted_at=article.get("published_at"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            return sort_results_by_posted_at(out)
        except Exception as exc:
            log_platform_error("Mediastack", "trending", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=NEWS_CACHE_TTL)
