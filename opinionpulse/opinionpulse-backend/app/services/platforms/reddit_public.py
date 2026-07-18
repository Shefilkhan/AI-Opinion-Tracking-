"""Reddit public API (no OAuth required for search)."""

from __future__ import annotations

import logging
import re
import html
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import build_result, log_platform_error, log_platform_success
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    make_search_cache_key,
    sort_results_by_posted_at,
)

logger = logging.getLogger(__name__)
TIMEOUT = 12


def _clean_html(html_str: str) -> str:
    if not html_str:
        return ""
    md_match = re.search(
        r'<!-- SC_OFF -->.*?<div class="md">(.*?)</div>.*?<!-- SC_ON -->',
        html_str,
        re.DOTALL,
    )
    if md_match:
        html_str = md_match.group(1)
    else:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_str)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _headers() -> dict[str, str]:
    ua = get_settings().reddit_user_agent.strip() or "Mozilla/5.0 OpinionPulse/1.0"
    return {"User-Agent": ua}


def _fetch_reddit_rss(query: str, time_range: str, t: str, limit: int) -> list[dict]:
    """RSS fallback when JSON search is blocked."""
    try:
        url = (
            "https://www.reddit.com/search.rss"
            f"?q={requests.utils.quote(query)}&sort=new&t={t}&limit={limit}"
        )
        resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        namespaces = {"atom": "http://www.w3.org/2005/Atom"}
        results = []
        for entry in root.findall(".//atom:entry", namespaces):
            link_elem = entry.find("atom:link", namespaces)
            link = link_elem.attrib.get("href") if link_elem is not None else ""
            if "/comments/" not in link:
                continue
            title_elem = entry.find("atom:title", namespaces)
            title = title_elem.text if title_elem is not None else ""
            updated_elem = entry.find("atom:updated", namespaces)
            posted_at = updated_elem.text if updated_elem is not None else None
            row = build_result(
                id=f"reddit_rss_{len(results)}",
                platform="reddit",
                author="reddit",
                title=title,
                content=title,
                source_url=link,
                source_label="reddit.com",
                query=query,
                publication="Reddit",
                posted_at=posted_at,
                engagement_available=False,
                sentiment_text=title,
            )
            if row:
                results.append(row)
        return filter_by_time_range(results, time_range, fallback_to_all=False)
    except Exception as exc:
        log_platform_error("Reddit RSS fallback", query, exc)
        return []


def search_reddit(query: str, time_range: str = "24h", limit: int = 20) -> list[dict]:
    time_map = {"24h": "day", "7d": "week", "30d": "month"}
    t = time_map.get(time_range, "day")
    cache_key = make_search_cache_key("reddit", query, time_range, str(limit))

    def fetch() -> list[dict]:
        try:
            url = (
                "https://www.reddit.com/search.json"
                f"?q={requests.utils.quote(query)}&sort=new&t={t}&limit={limit}"
            )
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            if resp.status_code in (403, 429):
                results = _fetch_reddit_rss(query, time_range, t, limit)
                results = sort_results_by_posted_at(results)
                log_platform_success("Reddit (RSS fallback)", query, len(results))
                return results
            resp.raise_for_status()
            payload = resp.json()
            children = (payload.get("data") or {}).get("children") or []
            results = []
            for child in children:
                d = child.get("data") or {}
                permalink = d.get("permalink") or ""
                if "/comments/" not in permalink:
                    continue
                link = f"https://www.reddit.com{permalink}"
                title = (d.get("title") or "").strip()
                if not title:
                    continue
                selftext = (d.get("selftext") or "").strip()
                content = selftext if selftext else title
                author = (d.get("author") or "unknown").replace("/u/", "")
                subreddit = d.get("subreddit") or "all"
                post_id = d.get("id") or "unknown"
                created = d.get("created_utc")
                posted_at = (
                    datetime.fromtimestamp(float(created), tz=timezone.utc).isoformat()
                    if created
                    else None
                )
                preview = d.get("preview") or {}
                images = preview.get("images") or []
                image_url = None
                if images:
                    src = (images[0].get("source") or {}).get("url", "")
                    image_url = html.unescape(src) if src else None

                row = build_result(
                    id=f"reddit_{post_id}",
                    platform="reddit",
                    author=f"u/{author}",
                    title=title,
                    content=content,
                    source_url=link,
                    source_label=f"reddit.com/r/{subreddit}",
                    query=query,
                    publication="Reddit",
                    image_url=image_url,
                    posted_at=posted_at,
                    engagement={
                        "likes": int(d.get("score") or 0),
                        "shares": 0,
                        "comments": int(d.get("num_comments") or 0),
                        "views": 0,
                    },
                    engagement_available=True,
                    sentiment_text=f"{title} {selftext}",
                )
                if row:
                    results.append(row)
            results = filter_by_time_range(results, time_range, fallback_to_all=False)
            results = sort_results_by_posted_at(results)
            log_platform_success("Reddit", query, len(results))
            return results
        except Exception as exc:
            log_platform_error("Reddit", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=60)


def get_trending_reddit(limit: int = 10) -> list[dict]:
    import random

    subs = ["worldnews", "technology", "politics", "business", "science"]
    sub = random.choice(subs)
    cache_key = f"reddit_trending_{sub}_{limit}"

    def fetch() -> list[dict]:
        try:
            url = f"https://www.reddit.com/r/{sub}.rss?limit={limit}"
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            resp.raise_for_status()

            root = ET.fromstring(resp.content)
            namespaces = {"atom": "http://www.w3.org/2005/Atom"}
            entries = root.findall(".//atom:entry", namespaces)
            results = []
            for entry in entries:
                link_elem = entry.find("atom:link", namespaces)
                link = link_elem.attrib.get("href") if link_elem is not None else ""
                if "/comments/" not in link:
                    continue
                title_elem = entry.find("atom:title", namespaces)
                title = title_elem.text if title_elem is not None else ""
                author_elem = entry.find("atom:author/atom:name", namespaces)
                author_raw = author_elem.text if author_elem is not None else "unknown"
                author = author_raw.replace("/u/", "").replace("u/", "")
                updated_elem = entry.find("atom:updated", namespaces)
                posted_at = updated_elem.text if updated_elem is not None else ""
                content_elem = entry.find("atom:content", namespaces)
                content_html = content_elem.text if content_elem is not None else ""
                selftext = _clean_html(content_html)
                content = selftext if selftext else title
                parts = link.split("/")
                post_id = "unknown"
                if "comments" in parts:
                    cidx = parts.index("comments")
                    if cidx + 1 < len(parts):
                        post_id = parts[cidx + 1]
                row = build_result(
                    id=f"reddit_{post_id}",
                    platform="reddit",
                    author=f"u/{author}",
                    title=title,
                    content=content,
                    source_url=link,
                    source_label=f"reddit.com/r/{sub}",
                    query=sub,
                    publication="Reddit",
                    posted_at=posted_at,
                    engagement_available=False,
                    sentiment_text=f"{title} {selftext}",
                )
                if row:
                    results.append(row)
            return sort_results_by_posted_at(results)
        except Exception as exc:
            log_platform_error("Reddit", f"trending/{sub}", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=180)
