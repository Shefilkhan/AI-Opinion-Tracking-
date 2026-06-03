"""Reddit public JSON API (no OAuth required for search)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import build_result, log_platform_error, log_platform_success

logger = logging.getLogger(__name__)
TIMEOUT = 12


def _headers() -> dict[str, str]:
    ua = get_settings().reddit_user_agent.strip() or "Mozilla/5.0 OpinionPulse/1.0"
    return {"User-Agent": ua, "Accept": "application/json"}


def _map_post(p: dict[str, Any], query: str) -> dict[str, Any] | None:
    title = (p.get("title") or "").strip()
    selftext = (p.get("selftext") or "").strip()
    if selftext in ("[removed]", "[deleted]"):
        selftext = ""
    author = p.get("author") or "unknown"
    if author in ("[deleted]", "AutoModerator"):
        return None

    permalink = p.get("permalink") or ""
    if permalink.startswith("/"):
        source_url = f"https://www.reddit.com{permalink}"
    elif permalink.startswith("http"):
        source_url = permalink
    else:
        return None

    subreddit = p.get("subreddit", "all")
    content = selftext if selftext else title
    if len(content) < 5:
        return None

    thumb = p.get("thumbnail")
    image_url = thumb if isinstance(thumb, str) and thumb.startswith("http") else None

    return build_result(
        id=f"reddit_{p.get('id', '')}",
        platform="reddit",
        author=f"u/{author}",
        title=title,
        content=content,
        source_url=source_url,
        source_label=f"reddit.com/r/{subreddit}",
        query=query,
        publication="Reddit",
        image_url=image_url,
        posted_at=datetime.fromtimestamp(
            float(p.get("created_utc", 0)), tz=timezone.utc
        ).isoformat(),
        engagement={
            "likes": int(p.get("score") or 0),
            "shares": int(p.get("num_crossposts") or 0),
            "comments": int(p.get("num_comments") or 0),
            "views": 0,
        },
        sentiment_text=f"{title} {selftext}",
    )


def search_reddit(query: str, time_range: str = "24h", limit: int = 20) -> list[dict]:
    time_map = {"24h": "day", "7d": "week", "30d": "month"}
    t = time_map.get(time_range, "day")
    cache_key = f"reddit_{query}_{t}_{limit}"

    def fetch() -> list[dict]:
        try:
            url = (
                "https://www.reddit.com/search.json"
                f"?q={requests.utils.quote(query)}&sort=relevance&t={t}&limit={limit}"
            )
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            resp.raise_for_status()
            children = resp.json().get("data", {}).get("children", [])
            results = []
            for child in children:
                pdata = child.get("data")
                if isinstance(pdata, dict):
                    mapped = _map_post(pdata, query)
                    if mapped:
                        results.append(mapped)
            log_platform_success("Reddit", query, len(results))
            return results
        except Exception as exc:
            log_platform_error("Reddit", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)


def get_trending_reddit(limit: int = 10) -> list[dict]:
    import random

    subs = ["worldnews", "technology", "politics", "business", "science"]
    sub = random.choice(subs)
    cache_key = f"reddit_trending_{sub}_{limit}"

    def fetch() -> list[dict]:
        try:
            url = f"https://www.reddit.com/r/{sub}/hot.json?limit={limit}"
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            resp.raise_for_status()
            out = []
            for child in resp.json().get("data", {}).get("children", []):
                mapped = _map_post(child.get("data", {}), sub)
                if mapped:
                    out.append(mapped)
            return out
        except Exception as exc:
            log_platform_error("Reddit", f"trending/{sub}", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=180)
