"""Dev.to public API (no key required)."""

from __future__ import annotations

import requests

from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    make_search_cache_key,
    sort_results_by_posted_at,
    title_matches_query,
)

TIMEOUT = 12


def search_devto(query: str, time_range: str = "24h") -> list[dict]:
    cache_key = make_search_cache_key("devto", query, time_range)

    def fetch() -> list[dict]:
        try:
            q_lower = query.lower()
            tag = q_lower.split()[0][:25].replace(" ", "")
            articles: list[dict] = []

            if tag:
                resp = requests.get(
                    "https://dev.to/api/articles",
                    params={"tag": tag, "per_page": 20},
                    headers={"Accept": "application/json"},
                    timeout=TIMEOUT,
                )
                resp.raise_for_status()
                articles = resp.json() or []

            out = []
            for article in articles:
                title = (article.get("title") or "").strip()
                if not title or not title_matches_query(title, query):
                    continue
                desc = (article.get("description") or "").strip()
                user = article.get("user") or {}
                username = user.get("username") or "devto"
                article_url = article.get("url")
                if not article_url:
                    continue
                row = build_result(
                    id=f"devto_{article.get('id')}",
                    platform="devto",
                    author=user.get("name") or username,
                    title=title,
                    content=desc or title,
                    source_url=article_url,
                    source_label=f"dev.to · {username}",
                    query=query,
                    publication="Dev.to",
                    image_url=article.get("cover_image")
                    or article.get("social_image"),
                    posted_at=article.get("published_at"),
                    engagement={
                        "likes": int(article.get("positive_reactions_count") or 0),
                        "shares": 0,
                        "comments": int(article.get("comments_count") or 0),
                        "views": 0,
                    },
                    engagement_available=True,
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
                if len(out) >= 15:
                    break
            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("Dev.to", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Dev.to", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
