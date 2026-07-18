"""NewsAPI.org integration."""

from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
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
    make_search_cache_key,
    quoted_phrase_query,
    sort_results_by_posted_at,
)

TIMEOUT = 12
NEWS_CACHE_TTL = 180  # 3 minutes — keep trending/news results fresh


def search_news(query: str, time_range: str = "24h", page_size: int = 20) -> list[dict]:
    key = get_settings().news_api_key.strip()
    if not key:
        raise ValueError("NEWS_API_KEY not configured")

    from_date = iso_date_days_ago(time_range)
    cache_key = make_search_cache_key("newsapi", query, time_range, str(page_size))

    def fetch() -> list[dict]:
        try:
            params = {
                "q": quoted_phrase_query(query),
                "searchIn": "title",
                "from": from_date,
                "sortBy": "publishedAt",
                "pageSize": page_size,
                "language": "en",
                "apiKey": key,
            }
            resp = requests.get(
                "https://newsapi.org/v2/everything", params=params, timeout=TIMEOUT
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != "ok":
                raise RuntimeError(data.get("message", "NewsAPI error"))
            articles = data.get("articles", [])
            if not articles:
                params["searchIn"] = "title,description"
                resp = requests.get(
                    "https://newsapi.org/v2/everything", params=params, timeout=TIMEOUT
                )
                resp.raise_for_status()
                data = resp.json()
                if data.get("status") != "ok":
                    raise RuntimeError(data.get("message", "NewsAPI error"))
                articles = data.get("articles", [])
            out = []
            for art in articles:
                title = (art.get("title") or "").strip()
                if not title or title == "[Removed]":
                    continue
                article_url = art.get("url")
                if not article_url:
                    continue
                desc = (art.get("description") or "").strip()
                if desc == "[Removed]":
                    desc = ""
                content = (desc or art.get("content") or "").split("[+")[0][:350] or title
                try:
                    domain = urlparse(article_url).hostname.replace("www.", "") or "news"
                except Exception:
                    domain = art.get("source", {}).get("name", "news")
                aid = base64.urlsafe_b64encode(article_url.encode()).decode()[:12]
                row = build_result(
                    id=f"newsapi_{aid}",
                    platform="news",
                    author=art.get("author") or art.get("source", {}).get("name") or "News",
                    title=title,
                    content=content,
                    source_url=article_url,
                    source_label=domain,
                    query=query,
                    publication=art.get("source", {}).get("name") or domain,
                    image_url=art.get("urlToImage"),
                    posted_at=art.get("publishedAt"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            out = filter_headline_results(out, query, fallback_to_all=True)
            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("NewsAPI", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("NewsAPI", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=60)


def get_trending_news() -> list[dict]:
    key = get_settings().news_api_key.strip()
    if not key:
        return []
    cache_key = "newsapi_trending_us"

    def fetch() -> list[dict]:
        try:
            params = {"country": "us", "pageSize": 10, "apiKey": key}
            resp = requests.get(
                "https://newsapi.org/v2/top-headlines", params=params, timeout=TIMEOUT
            )
            resp.raise_for_status()
            out = []
            for art in resp.json().get("articles", []):
                title = (art.get("title") or "").strip()
                url = art.get("url")
                if not title or not url or title == "[Removed]":
                    continue
                desc = (art.get("description") or "").strip()
                aid = base64.urlsafe_b64encode(url.encode()).decode()[:12]
                row = build_result(
                    id=f"newsapi_trend_{aid}",
                    platform="news",
                    author=art.get("source", {}).get("name") or "News",
                    title=title,
                    content=desc or title,
                    source_url=url,
                    source_label=urlparse(url).hostname.replace("www.", ""),
                    query="trending",
                    publication=art.get("source", {}).get("name") or "News",
                    image_url=art.get("urlToImage"),
                    posted_at=art.get("publishedAt"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            return sort_results_by_posted_at(out)
        except Exception as exc:
            log_platform_error("NewsAPI", "trending", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=180)
