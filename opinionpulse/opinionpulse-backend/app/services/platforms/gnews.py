"""GNews API."""

from __future__ import annotations

import base64
import logging
from urllib.parse import urlparse

import requests

from app.core.config import get_settings
from app.services.cache_utils import cache_get, cache_set, cached
from app.services.platform_rate_limit import is_rate_limited, mark_rate_limited
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

logger = logging.getLogger(__name__)

TIMEOUT = 12
NEWS_CACHE_TTL = 180
GNEWS_RATE_LIMIT_CACHE_TTL = 300


def _gnews_get(url: str, params: dict) -> requests.Response:
    resp = requests.get(url, params=params, timeout=TIMEOUT)
    if resp.status_code == 429:
        mark_rate_limited("gnews", 300)
        raise requests.HTTPError("429 Too Many Requests", response=resp)
    return resp


def search_gnews(query: str, time_range: str = "24h") -> list[dict]:
    key = get_settings().gnews_api_key.strip()
    if not key:
        raise ValueError("GNEWS_API_KEY not configured")

    cache_key = f"gnews_{query}_{time_range}"
    if is_rate_limited("gnews"):
        hit = cache_get(cache_key)
        return hit if isinstance(hit, list) else []

    def fetch() -> list[dict]:
        try:
            params = {
                "q": quoted_phrase_query(query),
                "in": "title",
                "lang": "en",
                "max": "15",
                "sortby": "publishedAt",
                "from": iso_date_days_ago(time_range) + "T00:00:00Z",
                "token": key,
            }
            resp = _gnews_get(
                "https://gnews.io/api/v4/search", params
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
            if not out:
                params["in"] = "title,description"
                resp = _gnews_get(
                    "https://gnews.io/api/v4/search", params
                )
                resp.raise_for_status()
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
            out = filter_headline_results(out, query, fallback_to_all=False)
            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("GNews", query, len(out))
            return out
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 429:
                cache_set(cache_key, [], GNEWS_RATE_LIMIT_CACHE_TTL)
                logger.warning("GNews: HTTP 429 for %r — cooling down", query)
                return []
            log_platform_error("GNews", query, exc)
            return []
        except Exception as exc:
            log_platform_error("GNews", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=NEWS_CACHE_TTL)


def get_trending_gnews(limit: int = 10) -> list[dict]:
    key = get_settings().gnews_api_key.strip()
    if not key:
        return []
    if is_rate_limited("gnews"):
        return []
    cache_key = f"gnews_trending_{limit}"

    def fetch() -> list[dict]:
        try:
            params = {
                "category": "general",
                "lang": "en",
                "max": str(limit),
                "token": key,
            }
            resp = _gnews_get(
                "https://gnews.io/api/v4/top-headlines", params
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
                    query="trending",
                    publication=article.get("source", {}).get("name") or domain,
                    image_url=article.get("image"),
                    posted_at=article.get("publishedAt"),
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            return sort_results_by_posted_at(out)
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 429:
                logger.warning("GNews trending: HTTP 429 — cooling down")
                return []
            log_platform_error("GNews", "trending", exc)
            return []
        except Exception as exc:
            log_platform_error("GNews", "trending", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=NEWS_CACHE_TTL)
