"""Mastodon API search (authenticated via access token)."""

from __future__ import annotations

import html
import re
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
    make_search_cache_key,
    sort_results_by_posted_at,
)

TIMEOUT = 12


def _strip_html(html_content: str) -> str:
    """Mastodon returns post content as HTML — strip tags for clean text."""
    if not html_content:
        return ""
    text = re.sub(r"<[^>]+>", "", html_content)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _instance_base() -> str:
    settings = get_settings()
    raw = (settings.mastodon_instance_url or "https://mastodon.social").strip()
    return raw.rstrip("/")


def _instance_label(base_url: str) -> str:
    host = urlparse(base_url).hostname or "mastodon.social"
    return host.replace("www.", "")


def search_mastodon(query: str, time_range: str = "24h", limit: int = 15) -> list[dict]:
    cache_key = make_search_cache_key("mastodon", query, time_range, str(limit))

    def fetch() -> list[dict]:
        settings = get_settings()
        token = (settings.mastodon_access_token or "").strip()
        if not token:
            print("⚠️ Mastodon: no access token configured, skipping")
            return []

        base_url = _instance_base()
        instance = _instance_label(base_url)
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "OpinionPulse/1.0",
        }

        try:
            resp = requests.get(
                f"{base_url}/api/v2/search",
                params={
                    "q": query,
                    "type": "statuses",
                    "limit": limit,
                    "resolve": "false",
                },
                headers=headers,
                timeout=TIMEOUT,
            )
            if resp.status_code != 200:
                print(
                    f"⚠️ Mastodon search failed: {resp.status_code} {resp.text}"
                )
                return []

            statuses = resp.json().get("statuses") or []
            out: list[dict] = []
            for status in statuses:
                content = _strip_html(status.get("content", ""))
                if not content:
                    continue

                account = status.get("account") or {}
                author = account.get("username") or "unknown"
                display = account.get("display_name") or author
                title = content[:120] + ("..." if len(content) > 120 else "")

                image_url = None
                for media in status.get("media_attachments") or []:
                    if media.get("type") == "image":
                        image_url = media.get("url")
                        break

                row = build_result(
                    id=f"mastodon_{status.get('id')}",
                    platform="mastodon",
                    author=f"@{author}",
                    title=title,
                    content=content,
                    source_url=status.get("url") or "",
                    source_label=f"{instance} · @{author}",
                    query=query,
                    publication="Mastodon",
                    image_url=image_url,
                    posted_at=status.get("created_at"),
                    engagement={
                        "likes": int(status.get("favourites_count") or 0),
                        "shares": int(status.get("reblogs_count") or 0),
                        "comments": int(status.get("replies_count") or 0),
                        "views": 0,
                    },
                    sentiment_text=content,
                )
                if row:
                    out.append(row)

            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("Mastodon", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Mastodon", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
