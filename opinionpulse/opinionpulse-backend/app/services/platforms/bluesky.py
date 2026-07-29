"""Bluesky AT Protocol search (authenticated or public fallback)."""

from __future__ import annotations

import time

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
    filter_relevant_results,
    make_search_cache_key,
    quoted_phrase_query,
    sort_results_by_posted_at,
)

BLUESKY_API_BASE = "https://bsky.social/xrpc"
BLUESKY_PUBLIC_BASE = "https://public.api.bsky.app/xrpc"
TIMEOUT = 12

_session_cache: dict[str, object] = {"access_jwt": None, "expires_at": 0.0}


def _get_session() -> str | None:
    """
    Get a valid Bluesky access token, authenticating if needed.
    Falls back to None if no credentials configured (uses public endpoint).
    """
    settings = get_settings()
    handle = (settings.bluesky_handle or "").strip()
    password = (settings.bluesky_app_password or "").strip()
    if not handle or not password:
        return None

    if (
        _session_cache["access_jwt"]
        and time.time() < float(_session_cache["expires_at"]) - 300
    ):
        return str(_session_cache["access_jwt"])

    try:
        resp = requests.post(
            f"{BLUESKY_API_BASE}/com.atproto.server.createSession",
            json={"identifier": handle, "password": password},
            timeout=TIMEOUT,
        )
        if resp.status_code != 200:
            print(f"⚠️ Bluesky auth failed: {resp.text}")
            return None

        data = resp.json()
        _session_cache["access_jwt"] = data["accessJwt"]
        _session_cache["expires_at"] = time.time() + 7200
        return data["accessJwt"]
    except Exception as exc:
        print(f"⚠️ Bluesky session error: {exc}")
        return None


def _post_url(post: dict) -> str:
    author = post.get("author") or {}
    handle = author.get("handle") or ""
    uri = post.get("uri") or ""
    rkey = uri.split("/")[-1] if uri else ""
    if handle and rkey:
        return f"https://bsky.app/profile/{handle}/post/{rkey}"
    return ""


def search_bluesky(query: str, time_range: str = "24h", limit: int = 15) -> list[dict]:
    cache_key = make_search_cache_key("bluesky", query, time_range, str(limit))

    def fetch() -> list[dict]:
        try:
            access_token = _get_session()
            base_url = BLUESKY_API_BASE if access_token else BLUESKY_PUBLIC_BASE
            headers = (
                {"Authorization": f"Bearer {access_token}"} if access_token else {}
            )

            resp = requests.get(
                f"{base_url}/app.bsky.feed.searchPosts",
                params={"q": quoted_phrase_query(query), "limit": limit, "sort": "latest"},
                headers=headers,
                timeout=TIMEOUT,
            )
            if resp.status_code != 200:
                print(
                    f"⚠️ Bluesky search failed: {resp.status_code} {resp.text}"
                )
                return []

            posts = resp.json().get("posts") or []
            out: list[dict] = []
            for post in posts:
                record = post.get("record") or {}
                text = (record.get("text") or "").strip()
                if not text:
                    continue

                author = post.get("author") or {}
                handle = author.get("handle") or "unknown"
                title = text[:120] + ("..." if len(text) > 120 else "")
                uri = post.get("uri") or ""
                safe_id = uri.replace(":", "_").replace("/", "_") or str(len(out))

                row = build_result(
                    id=f"bluesky_{safe_id}",
                    platform="bluesky",
                    author=f"@{handle}",
                    title=title,
                    content=text,
                    source_url=_post_url(post),
                    source_label=f"bsky.app · @{handle}",
                    query=query,
                    publication="Bluesky",
                    posted_at=record.get("createdAt"),
                    engagement={
                        "likes": int(post.get("likeCount") or 0),
                        "shares": int(post.get("repostCount") or 0),
                        "comments": int(post.get("replyCount") or 0),
                        "views": 0,
                    },
                    sentiment_text=text,
                )
                if row:
                    out.append(row)

            out = filter_relevant_results(
                filter_by_time_range(out, time_range, fallback_to_all=False),
                query,
            )
            out = sort_results_by_posted_at(out)
            log_platform_success("Bluesky", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("Bluesky", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=300)
