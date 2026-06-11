"""Mastodon API integration (Free public API)."""

from __future__ import annotations

import logging
from typing import Any
import re
import html

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import build_result, log_platform_error, log_platform_success

logger = logging.getLogger(__name__)
TIMEOUT = 12


def _clean_html(html_str: str) -> str:
    if not html_str:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html_str)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _headers() -> dict[str, str]:
    return {"User-Agent": "OpinionPulse/1.0"}


def search_mastodon(query: str, time_range: str = "24h", limit: int = 20) -> list[dict]:
    cache_key = f"mastodon_{query}_{time_range}_{limit}"

    def fetch() -> list[dict]:
        try:
            url = f"https://mastodon.social/api/v2/search?q={requests.utils.quote(query)}&type=statuses&limit={limit}"
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            resp.raise_for_status()
            
            data = resp.json()
            statuses = data.get("statuses", [])
            
            results = []
            for status in statuses:
                content_html = status.get("content", "")
                content = _clean_html(content_html)
                if not content:
                    continue
                
                account = status.get("account", {})
                author = account.get("username", "unknown")
                author_display = account.get("display_name", author)
                
                # Try to get media attachments
                media_attachments = status.get("media_attachments", [])
                image_url = None
                for media in media_attachments:
                    if media.get("type") == "image":
                        image_url = media.get("url")
                        break
                
                results.append(build_result(
                    id=f"mastodon_{status.get('id')}",
                    platform="mastodon",
                    author=f"@{author}",
                    title=f"Post by {author_display}",
                    content=content,
                    source_url=status.get("url", ""),
                    source_label="mastodon.social",
                    query=query,
                    publication="Mastodon",
                    image_url=image_url,
                    posted_at=status.get("created_at", ""),
                    engagement={
                        "likes": status.get("favourites_count", 0),
                        "shares": status.get("reblogs_count", 0),
                        "comments": status.get("replies_count", 0),
                        "views": 0,
                    },
                    sentiment_text=content,
                ))
                
            log_platform_success("Mastodon", query, len(results))
            return results
        except Exception as exc:
            log_platform_error("Mastodon", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
