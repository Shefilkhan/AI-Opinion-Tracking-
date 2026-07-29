"""YouTube Data API v3 search and trending."""

from __future__ import annotations

from typing import Any

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)
from app.services.platforms.query_helpers import (
    filter_relevant_results,
    iso_datetime_days_ago,
    quoted_phrase_query,
    sort_results_by_posted_at,
)

TIMEOUT = 15
API_BASE = "https://www.googleapis.com/youtube/v3"
NEWS_CACHE_TTL = 180


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
    published_after = iso_datetime_days_ago(time_range)
    cache_key = f"youtube_{query}_{time_range}_{max_results}"

    def fetch() -> list[dict]:
        try:
            search_data = _get(
                "search",
                {
                    "part": "snippet",
                    "q": quoted_phrase_query(query),
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
            out = filter_relevant_results(out, query)
            out = sort_results_by_posted_at(out)
            log_platform_success("YouTube", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("YouTube", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=NEWS_CACHE_TTL)


def fetch_youtube_comments(
    video_ids: list[str],
    query: str,
    *,
    max_per_video: int = 3,
    max_videos: int = 5,
) -> list[dict]:
    """Fetch top comment threads from YouTube videos."""
    if not video_ids:
        return []

    out: list[dict] = []
    for video_id in video_ids[:max_videos]:
        try:
            data = _get(
                "commentThreads",
                {
                    "part": "snippet",
                    "videoId": video_id,
                    "order": "relevance",
                    "maxResults": max_per_video,
                    "textFormat": "plainText",
                },
            )
            for item in data.get("items") or []:
                snippet = item.get("snippet", {})
                top = snippet.get("topLevelComment", {}).get("snippet", {})
                text = (top.get("textDisplay") or top.get("textOriginal") or "").strip()
                if not text:
                    continue
                author = top.get("authorDisplayName") or "YouTube User"
                comment_id = item.get("id") or top.get("authorChannelId", {}).get("value", "")
                posted = top.get("publishedAt") or snippet.get("publishedAt")
                likes = int(top.get("likeCount") or 0)
                row = build_result(
                    id=f"yt_comment_{comment_id or video_id}_{len(out)}",
                    platform="youtube",
                    author=author,
                    title=f"Comment on video {video_id}",
                    content=text,
                    source_url=f"https://www.youtube.com/watch?v={video_id}&lc={comment_id}",
                    source_label=f"youtube.com · comment",
                    query=query,
                    publication="YouTube",
                    posted_at=posted,
                    engagement={
                        "likes": likes,
                        "shares": 0,
                        "comments": 0,
                        "views": 0,
                    },
                    sentiment_text=text,
                )
                if row:
                    row["content_type"] = "comment"
                    row["is_comment"] = True
                    row["metadata"] = {"video_id": video_id, "type": "comment"}
                    out.append(row)
        except Exception as exc:
            log_platform_error("YouTube", f"comments:{video_id}", exc)
            continue
    return out


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
