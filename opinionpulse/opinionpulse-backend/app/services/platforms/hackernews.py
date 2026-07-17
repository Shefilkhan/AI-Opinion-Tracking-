"""Hacker News via Algolia API (no key required)."""

from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import urlparse

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
    quoted_phrase_query,
    sort_results_by_posted_at,
    time_range_cutoff,
)

TIMEOUT = 12


def search_hackernews(query: str, time_range: str = "24h") -> list[dict]:
    cache_key = make_search_cache_key("hackernews", query, time_range)
    cutoff_ts = int(time_range_cutoff(time_range).timestamp())

    def fetch() -> list[dict]:
        try:
            params = {
                "query": quoted_phrase_query(query),
                "tags": "story",
                "hitsPerPage": 20,
                "numericFilters": f"created_at_i>{cutoff_ts}",
            }
            resp = requests.get(
                "https://hn.algolia.com/api/v1/search",
                params=params,
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            out = []
            for item in resp.json().get("hits") or []:
                title = (item.get("title") or "").strip()
                if not title:
                    continue
                oid = item.get("objectID", "")
                story_text = (item.get("story_text") or "").strip()
                source_url = item.get("url") or (
                    f"https://news.ycombinator.com/item?id={oid}"
                )
                if item.get("url"):
                    try:
                        domain = urlparse(item["url"]).hostname.replace("www.", "")
                    except Exception:
                        domain = "news.ycombinator.com"
                else:
                    domain = "news.ycombinator.com"
                created = item.get("created_at")
                posted = (
                    datetime.fromisoformat(created.replace("Z", "+00:00")).isoformat()
                    if created
                    else None
                )
                row = build_result(
                    id=f"hn_{oid}",
                    platform="hackernews",
                    author=item.get("author") or "HN",
                    title=title,
                    content=story_text or title,
                    source_url=source_url,
                    source_label=domain,
                    query=query,
                    publication="Hacker News",
                    posted_at=posted,
                    engagement={
                        "likes": int(item.get("points") or 0),
                        "shares": 0,
                        "comments": int(item.get("num_comments") or 0),
                        "views": 0,
                    },
                    engagement_available=True,
                    sentiment_text=f"{title} {story_text}",
                )
                if row:
                    out.append(row)
            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("HackerNews", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("HackerNews", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
