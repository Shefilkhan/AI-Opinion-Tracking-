"""YouTube collection helpers for project-based mention ingestion."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.services.platforms.youtube_client import YouTubeApiError, youtube_get

logger = logging.getLogger(__name__)


def _parse_published_at(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        cleaned = value.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except ValueError:
        return None


def search_youtube_videos(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """Search videos via search.list (used by project collection)."""
    query = query.strip()
    if not query:
        return []

    max_results = max(1, min(max_results, 50))
    payload = youtube_get(
        "search",
        {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "order": "relevance",
        },
    )

    videos: List[Dict[str, Any]] = []
    for item in payload.get("items", []):
        if not isinstance(item, dict):
            continue
        item_id = item.get("id", {})
        video_id = item_id.get("videoId") if isinstance(item_id, dict) else None
        snippet = item.get("snippet", {})
        if not video_id or not isinstance(snippet, dict):
            continue
        title = (snippet.get("title") or "").strip()
        if not title:
            continue
        videos.append(
            {
                "video_id": video_id,
                "title": title,
                "channel_title": (snippet.get("channelTitle") or "").strip(),
                "published_at": _parse_published_at(snippet.get("publishedAt")),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "raw_json": item,
            }
        )
    return videos


def get_video_comments(video_id: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Top-level comments via commentThreads.list (project collection)."""
    video_id = video_id.strip()
    if not video_id:
        return []

    max_results = max(1, min(max_results, 100))
    try:
        payload = youtube_get(
            "commentThreads",
            {
                "part": "snippet",
                "videoId": video_id,
                "maxResults": max_results,
                "textFormat": "plainText",
                "order": "relevance",
            },
        )
    except YouTubeApiError as exc:
        if exc.comments_disabled or "disabled" in str(exc).lower():
            logger.info("Comments disabled for video %s", video_id)
            return []
        raise

    comments: List[Dict[str, Any]] = []
    for item in payload.get("items", []):
        if not isinstance(item, dict):
            continue
        snippet_top = item.get("snippet", {})
        if not isinstance(snippet_top, dict):
            continue
        top_comment = snippet_top.get("topLevelComment", {})
        if not isinstance(top_comment, dict):
            continue
        comment_snippet = top_comment.get("snippet", {})
        if not isinstance(comment_snippet, dict):
            continue

        comment_id = top_comment.get("id")
        text = (
            comment_snippet.get("textDisplay") or comment_snippet.get("textOriginal") or ""
        ).strip()
        if not comment_id or not text:
            continue

        like_count = comment_snippet.get("likeCount", 0)
        try:
            engagement = int(like_count)
        except (TypeError, ValueError):
            engagement = 0

        comments.append(
            {
                "source_item_id": str(comment_id)[:255],
                "source_parent_id": video_id[:255],
                "author": (comment_snippet.get("authorDisplayName") or "YouTube User")[:255],
                "text": text,
                "url": f"https://www.youtube.com/watch?v={video_id}&lc={comment_id}",
                "published_at": _parse_published_at(comment_snippet.get("publishedAt")),
                "engagement_score": engagement,
                "raw_json": item,
            }
        )
    return comments


def collect_youtube_for_keyword(
    keyword: str,
    max_videos: Optional[int] = None,
    max_comments: Optional[int] = None,
) -> Dict[str, Any]:
    """Search videos for a keyword and collect top-level comments."""
    settings = get_settings()
    max_videos = max_videos or settings.youtube_max_videos_per_keyword
    max_comments = max_comments or settings.youtube_max_comments_per_video

    result: Dict[str, Any] = {
        "keyword": keyword,
        "videos": [],
        "comments": [],
        "error": None,
        "quota_exceeded": False,
    }

    try:
        videos = search_youtube_videos(keyword, max_results=max_videos)
        result["videos"] = videos
        for video in videos:
            video_id = video["video_id"]
            try:
                comments = get_video_comments(video_id, max_results=max_comments)
                result["comments"].extend(comments)
            except YouTubeApiError as exc:
                if exc.quota_exceeded:
                    result["quota_exceeded"] = True
                    result["error"] = str(exc)
                    return result
                logger.warning("Skipping comments for video %s: %s", video_id, exc)
    except YouTubeApiError as exc:
        result["error"] = str(exc)
        result["quota_exceeded"] = exc.quota_exceeded

    return result
