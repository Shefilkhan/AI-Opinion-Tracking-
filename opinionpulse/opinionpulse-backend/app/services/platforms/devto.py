"""Dev.to public API (no key required)."""

from __future__ import annotations

import requests

from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)

TIMEOUT = 12


def search_devto(query: str, time_range: str = "24h") -> list[dict]:
    cache_key = f"devto_{query}"

    def fetch() -> list[dict]:
        try:
            q_lower = query.lower()
            tag = q_lower.split()[0][:25].replace(" ", "")
            articles: list[dict] = []

            if tag:
                resp = requests.get(
                    "https://dev.to/api/articles",
                    params={"tag": tag, "per_page": 15},
                    headers={"Accept": "application/json"},
                    timeout=TIMEOUT,
                )
                resp.raise_for_status()
                articles = resp.json() or []

            if len(articles) < 5:
                resp = requests.get(
                    "https://dev.to/api/articles",
                    params={"per_page": 30},
                    headers={"Accept": "application/json"},
                    timeout=TIMEOUT,
                )
                resp.raise_for_status()
                seen = {a.get("id") for a in articles}
                for a in resp.json() or []:
                    if a.get("id") not in seen:
                        articles.append(a)

            out = []
            for article in articles:
                title = (article.get("title") or "").strip()
                if not title:
                    continue
                desc = (article.get("description") or "").strip()
                haystack = f"{title} {desc}".lower()
                if q_lower not in haystack and not any(
                    w in haystack for w in q_lower.split() if len(w) > 2
                ):
                    continue
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
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
                if len(out) >= 15:
                    break
            log_platform_success("Dev.to", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Dev.to", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=300)
