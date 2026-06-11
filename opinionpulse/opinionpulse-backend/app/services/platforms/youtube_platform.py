"""YouTube Data API v3 search and trending."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)

TIMEOUT = 15
API_BASE = "https://www.googleapis.com/youtube/v3"


def _api_key() -> str:
    key = get_settings().youtube_api_key.strip()
    if not key:
        raise ValueError("YOUTUBE_API_KEY not configured")
    return key


def _get(endpoint: str, params: dict[str, Any]) -> dict:
    params = {**params, "key": _api_key()}
    resp = requests.get(f"{API_BASE}/{endpoint}", params=params, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def search_youtube(query: str, time_range: str = "7d", max_results: int = 15) -> list[dict]:
    days = {"24h": 1, "7d": 7, "30d": 30}.get(time_range, 7)
    published_after = (
        datetime.now(timezone.utc) - timedelta(days=days)
    ).isoformat().replace("+00:00", "Z")
    cache_key = f"youtube_{query}_{time_range}_{max_results}"

    def fetch() -> list[dict]:
        try:
            search_data = _get(
                "search",
                {
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "order": "relevance",
                    "maxResults": max_results,
                    "publishedAfter": published_after,
                    "relevanceLanguage": "en",
                },
            )
            items = search_data.get("items", [])
            video_ids = [
                it.get("id", {}).get("videoId")
                for it in items
                if it.get("id", {}).get("videoId")
            ]
            stats_map: dict[str, dict] = {}
            if video_ids:
                stats_data = _get(
                    "videos", {"part": "statistics", "id": ",".join(video_ids)}
                )
                for v in stats_data.get("items", []):
                    stats_map[v["id"]] = v.get("statistics", {})

            out = []
            for item in items:
                video_id = item.get("id", {}).get("videoId")
                snippet = item.get("snippet", {})
                if not video_id or not snippet:
                    continue
                title = (snippet.get("title") or "").strip()
                desc = (snippet.get("description") or "").strip()
                thumbs = snippet.get("thumbnails") or {}
                thumb = (
                    thumbs.get("medium", {}).get("url")
                    or thumbs.get("default", {}).get("url")
                )
                stats = stats_map.get(video_id, {})
                row = build_result(
                    id=f"youtube_{video_id}",
                    platform="youtube",
                    author=snippet.get("channelTitle") or "YouTube",
                    title=title,
                    content=desc or title,
                    source_url=f"https://www.youtube.com/watch?v={video_id}",
                    source_label=f"youtube.com · {snippet.get('channelTitle', '')}",
                    query=query,
                    publication="YouTube",
                    image_url=thumb,
                    posted_at=snippet.get("publishedAt"),
                    engagement={
                        "likes": int(stats.get("likeCount") or 0),
                        "shares": 0,
                        "comments": int(stats.get("commentCount") or 0),
                        "views": int(stats.get("viewCount") or 0),
                    },
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            log_platform_success("YouTube", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("YouTube", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=600)


def get_trending_youtube(region_code: str = "US") -> list[dict]:
    cache_key = f"youtube_trending_{region_code}"

    def fetch() -> list[dict]:
        try:
            data = _get(
                "videos",
                {
                    "part": "snippet,statistics",
                    "chart": "mostPopular",
                    "regionCode": region_code,
                    "maxResults": 10,
                    "videoCategoryId": "25",
                },
            )
            out = []
            for item in data.get("items", []):
                vid = item.get("id")
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                if not vid or not snippet:
                    continue
                title = (snippet.get("title") or "").strip()
                desc = (snippet.get("description") or "").strip()
                row = build_result(
                    id=f"youtube_{vid}",
                    platform="youtube",
                    author=snippet.get("channelTitle") or "YouTube",
                    title=title,
                    content=desc or title,
                    source_url=f"https://www.youtube.com/watch?v={vid}",
                    source_label="youtube.com",
                    query="trending",
                    publication="YouTube",
                    image_url=(snippet.get("thumbnails") or {})
                    .get("medium", {})
                    .get("url"),
                    posted_at=snippet.get("publishedAt"),
                    engagement={
                        "likes": int(stats.get("likeCount") or 0),
                        "shares": 0,
                        "comments": int(stats.get("commentCount") or 0),
                        "views": int(stats.get("viewCount") or 0),
                    },
                    sentiment_text=f"{title} {desc}",
                )
                if row:
                    out.append(row)
            return out
        except Exception as exc:
            log_platform_error("YouTube", "trending", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=600)
