"""YouTube Data API v3 search, comments, and trending for live OpinionPulse search."""

from __future__ import annotations

import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any

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
    iso_datetime_days_ago,
    quoted_phrase_query,
    sort_results_by_posted_at,
)
from app.services.platforms.youtube_client import (
    YouTubeApiError,
    api_key_configured,
    batch_video_ids,
    youtube_get,
)

logger = logging.getLogger(__name__)

# Stable external ID prefixes for deduplication across scans
ID_VIDEO = "youtube:video:"
ID_COMMENT = "youtube:comment:"
ID_REPLY = "youtube:reply:"


def _youtube_settings() -> dict[str, Any]:
    s = get_settings()
    return {
        "enabled": s.youtube_enabled,
        "max_videos": s.youtube_max_videos_per_search,
        "comments_per_video": s.youtube_comments_per_video,
        "max_replies_per_comment": s.youtube_max_replies_per_comment,
        "include_replies": s.youtube_include_replies,
        "cache_ttl": s.youtube_cache_ttl_seconds,
        "max_concurrent": s.youtube_max_concurrent_requests,
        "region_code": s.youtube_region_code,
        "relevance_language": s.youtube_relevance_language,
    }


def _cache_key(prefix: str, *parts: str) -> str:
    safe = ":".join(re.sub(r"[^a-zA-Z0-9_-]", "_", p.lower())[:80] for p in parts if p)
    return f"youtube:{prefix}:{safe}"


def _safe_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _video_metadata_row(
    *,
    video_id: str,
    snippet: dict[str, Any],
    stats: dict[str, Any],
    content_details: dict[str, Any] | None,
    query: str,
) -> dict[str, Any] | None:
    title = (snippet.get("title") or "").strip()
    desc = (snippet.get("description") or "").strip()
    if not title:
        return None

    thumbs = snippet.get("thumbnails") or {}
    thumb = (
        thumbs.get("medium", {}).get("url")
        or thumbs.get("high", {}).get("url")
        or thumbs.get("default", {}).get("url")
    )
    channel_id = snippet.get("channelId") or ""
    channel_title = snippet.get("channelTitle") or "YouTube"
    duration = (content_details or {}).get("duration")
    tags = snippet.get("tags") or []

    views = _safe_int(stats.get("viewCount"))
    likes = _safe_int(stats.get("likeCount"))
    comment_count = _safe_int(stats.get("commentCount"))

    row = build_result(
        id=f"{ID_VIDEO}{video_id}",
        platform="youtube",
        author=channel_title,
        title=title,
        content=desc or title,
        source_url=f"https://www.youtube.com/watch?v={video_id}",
        source_label=f"youtube.com · {channel_title}",
        query=query,
        publication="YouTube",
        image_url=thumb,
        posted_at=snippet.get("publishedAt"),
        engagement={
            "likes": likes,
            "shares": 0,
            "comments": comment_count,
            "views": views,
        },
        sentiment_text=f"{title} {desc}",
    )
    if not row:
        return None

    row["content_type"] = "video"
    row["metadata"] = {
        "video_id": video_id,
        "channel_id": channel_id,
        "channel_name": channel_title,
        "duration": duration,
        "tags": tags[:10] if isinstance(tags, list) else [],
        "type": "video",
        "audience_role": "creator",
    }
    if views > 0:
        row["metadata"]["like_rate"] = round(likes / views, 6)
        row["metadata"]["comment_rate"] = round(comment_count / views, 6)
    return row


def _comment_row(
    *,
    comment_id: str,
    video_id: str,
    video_title: str,
    text: str,
    author: str,
    author_channel_id: str | None,
    posted_at: str | None,
    likes: int,
    reply_count: int,
    query: str,
    content_type: str = "comment",
    parent_comment_id: str | None = None,
) -> dict[str, Any] | None:
    if not text.strip():
        return None

    prefix = ID_REPLY if content_type == "reply" else ID_COMMENT
    row = build_result(
        id=f"{prefix}{comment_id}",
        platform="youtube",
        author=author or "YouTube User",
        title=f"Comment on {video_title[:80]}" if content_type == "comment" else f"Reply on {video_title[:60]}",
        content=text.strip(),
        source_url=f"https://www.youtube.com/watch?v={video_id}&lc={comment_id}",
        source_label="youtube.com · comment",
        query=query,
        publication="YouTube",
        posted_at=posted_at,
        engagement={
            "likes": likes,
            "shares": 0,
            "comments": reply_count if content_type == "comment" else 0,
            "views": 0,
        },
        sentiment_text=text,
    )
    if not row:
        return None

    row["content_type"] = content_type
    row["is_comment"] = content_type in ("comment", "reply")
    meta: dict[str, Any] = {
        "video_id": video_id,
        "video_title": video_title,
        "type": content_type,
        "audience_role": "audience",
        "author_channel_id": author_channel_id,
    }
    if parent_comment_id:
        meta["parent_comment_id"] = parent_comment_id
        meta["root_video_id"] = video_id
    row["metadata"] = meta
    return row


def _search_video_ids(
    query: str,
    *,
    max_results: int,
    time_range: str,
    region_code: str,
    relevance_language: str,
) -> list[str]:
    published_after = iso_datetime_days_ago(time_range)
    params: dict[str, Any] = {
        "part": "snippet",
        "q": quoted_phrase_query(query),
        "type": "video",
        "order": "relevance",
        "maxResults": min(max_results, 50),
        "publishedAfter": published_after,
    }
    if region_code:
        params["regionCode"] = region_code
    if relevance_language:
        params["relevanceLanguage"] = relevance_language

    logger.info("youtube.search.started query=%r max=%s", query, max_results)
    data = youtube_get("search", params)
    ids = [
        it.get("id", {}).get("videoId")
        for it in data.get("items") or []
        if isinstance(it, dict) and it.get("id", {}).get("videoId")
    ]
    logger.info("youtube.search.completed query=%r videos=%s", query, len(ids))
    return ids


def _fetch_videos_detail(video_ids: list[str]) -> dict[str, dict[str, Any]]:
    """Batch-fetch snippet, statistics, contentDetails for video IDs."""
    out: dict[str, dict[str, Any]] = {}
    for batch in batch_video_ids(video_ids):
        data = youtube_get(
            "videos",
            {"part": "snippet,statistics,contentDetails", "id": ",".join(batch)},
        )
        for item in data.get("items") or []:
            vid = item.get("id")
            if vid:
                out[vid] = item
    logger.info("youtube.videos.fetched count=%s", len(out))
    return out


def _fetch_comment_threads_page(
    video_id: str,
    *,
    max_results: int,
    page_token: str | None = None,
) -> tuple[list[dict[str, Any]], str | None]:
    params: dict[str, Any] = {
        "part": "snippet,replies",
        "videoId": video_id,
        "order": "relevance",
        "maxResults": min(max_results, 100),
        "textFormat": "plainText",
    }
    if page_token:
        params["pageToken"] = page_token
    data = youtube_get("commentThreads", params)
    return data.get("items") or [], data.get("nextPageToken")


def _fetch_additional_replies(parent_id: str, *, limit: int) -> list[dict[str, Any]]:
    """Fetch replies beyond those embedded in commentThreads via comments.list."""
    if limit <= 0:
        return []
    try:
        data = youtube_get(
            "comments",
            {
                "part": "snippet",
                "parentId": parent_id,
                "maxResults": min(limit, 100),
                "textFormat": "plainText",
            },
        )
        return data.get("items") or []
    except YouTubeApiError as exc:
        if exc.comments_disabled:
            return []
        logger.warning("youtube.replies.fetch_failed parent=%s err=%s", parent_id, exc)
        return []


def _parse_thread_comments(
    thread_items: list[dict[str, Any]],
    *,
    video_id: str,
    video_title: str,
    query: str,
    include_replies: bool,
    max_replies_per_comment: int,
    seen_ids: set[str],
) -> tuple[list[dict], int, int]:
    """Return (rows, comment_count, reply_count) from comment thread items."""
    rows: list[dict] = []
    comments_n = 0
    replies_n = 0

    for item in thread_items:
        snippet = item.get("snippet") or {}
        top = snippet.get("topLevelComment") or {}
        top_snippet = top.get("snippet") or {}
        comment_id = top.get("id") or item.get("id")
        if not comment_id or comment_id in seen_ids:
            continue

        text = (top_snippet.get("textDisplay") or top_snippet.get("textOriginal") or "").strip()
        if not text:
            continue

        total_reply_count = _safe_int(snippet.get("totalReplyCount"))
        likes = _safe_int(top_snippet.get("likeCount"))
        author = top_snippet.get("authorDisplayName") or "YouTube User"
        author_ch = (top_snippet.get("authorChannelId") or {}).get("value")

        row = _comment_row(
            comment_id=str(comment_id),
            video_id=video_id,
            video_title=video_title,
            text=text,
            author=author,
            author_channel_id=author_ch,
            posted_at=top_snippet.get("publishedAt"),
            likes=likes,
            reply_count=total_reply_count,
            query=query,
            content_type="comment",
        )
        if row:
            seen_ids.add(str(comment_id))
            rows.append(row)
            comments_n += 1

        if not include_replies:
            continue

        embedded = (snippet.get("replies") or {}).get("comments") or []
        embedded_ids: set[str] = set()
        for reply_item in embedded:
            reply_snippet = (reply_item.get("snippet") or {})
            reply_id = reply_item.get("id")
            if not reply_id or reply_id in seen_ids:
                continue
            reply_text = (reply_snippet.get("textDisplay") or reply_snippet.get("textOriginal") or "").strip()
            if not reply_text:
                continue
            reply_row = _comment_row(
                comment_id=str(reply_id),
                video_id=video_id,
                video_title=video_title,
                text=reply_text,
                author=reply_snippet.get("authorDisplayName") or "YouTube User",
                author_channel_id=(reply_snippet.get("authorChannelId") or {}).get("value"),
                posted_at=reply_snippet.get("publishedAt"),
                likes=_safe_int(reply_snippet.get("likeCount")),
                reply_count=0,
                query=query,
                content_type="reply",
                parent_comment_id=str(comment_id),
            )
            if reply_row:
                seen_ids.add(str(reply_id))
                embedded_ids.add(str(reply_id))
                rows.append(reply_row)
                replies_n += 1

        remaining = total_reply_count - len(embedded_ids)
        if remaining > 0 and len(embedded_ids) < max_replies_per_comment:
            extra_limit = min(max_replies_per_comment - len(embedded_ids), remaining)
            for reply_item in _fetch_additional_replies(str(comment_id), limit=extra_limit):
                reply_id = reply_item.get("id")
                if not reply_id or reply_id in seen_ids:
                    continue
                reply_snippet = reply_item.get("snippet") or {}
                reply_text = (reply_snippet.get("textDisplay") or reply_snippet.get("textOriginal") or "").strip()
                if not reply_text:
                    continue
                reply_row = _comment_row(
                    comment_id=str(reply_id),
                    video_id=video_id,
                    video_title=video_title,
                    text=reply_text,
                    author=reply_snippet.get("authorDisplayName") or "YouTube User",
                    author_channel_id=(reply_snippet.get("authorChannelId") or {}).get("value"),
                    posted_at=reply_snippet.get("publishedAt"),
                    likes=_safe_int(reply_snippet.get("likeCount")),
                    reply_count=0,
                    query=query,
                    content_type="reply",
                    parent_comment_id=str(comment_id),
                )
                if reply_row:
                    seen_ids.add(str(reply_id))
                    rows.append(reply_row)
                    replies_n += 1

    return rows, comments_n, replies_n


def _fetch_comments_for_video(
    video_id: str,
    video_title: str,
    query: str,
    *,
    comments_per_video: int,
    include_replies: bool,
    max_replies_per_comment: int,
    seen_ids: set[str],
) -> tuple[list[dict], dict[str, Any]]:
    """Fetch comments (+ optional replies) for one video."""
    stats: dict[str, Any] = {
        "video_id": video_id,
        "comments_available": True,
        "comments_fetched": 0,
        "replies_fetched": 0,
    }
    rows: list[dict] = []
    collected = 0
    page_token: str | None = None

    try:
        while collected < comments_per_video:
            page_size = min(100, comments_per_video - collected)
            items, page_token = _fetch_comment_threads_page(
                video_id, max_results=page_size, page_token=page_token
            )
            if not items:
                break
            parsed, c_n, r_n = _parse_thread_comments(
                items,
                video_id=video_id,
                video_title=video_title,
                query=query,
                include_replies=include_replies,
                max_replies_per_comment=max_replies_per_comment,
                seen_ids=seen_ids,
            )
            rows.extend(parsed)
            stats["comments_fetched"] += c_n
            stats["replies_fetched"] += r_n
            collected += c_n
            if not page_token:
                break
    except YouTubeApiError as exc:
        if exc.comments_disabled:
            logger.info("youtube.comments.disabled video_id=%s", video_id)
            stats["comments_available"] = False
            return [], stats
        if exc.quota_exceeded:
            stats["quota_exceeded"] = True
            raise
        logger.warning("youtube.comments.error video_id=%s err=%s", video_id, exc)
        stats["error"] = str(exc)

    return rows, stats


def fetch_youtube_audience_content(
    videos: list[dict[str, Any]],
    query: str,
    *,
    crisis_mode: bool = False,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """
    Fetch comments and replies for normalized YouTube video rows.
    Returns (audience_rows, fetch_stats).
    """
    cfg = _youtube_settings()
    if not cfg["enabled"] or not api_key_configured():
        return [], {"status": "disabled"}

    if crisis_mode:
        comments_per_video = min(cfg["comments_per_video"], 15)
        max_videos = min(len(videos), 3)
        include_replies = cfg["include_replies"] and not crisis_mode
        max_replies = min(cfg["max_replies_per_comment"], 5)
    else:
        comments_per_video = cfg["comments_per_video"]
        max_videos = len(videos)
        include_replies = cfg["include_replies"]
        max_replies = cfg["max_replies_per_comment"]

    video_targets: list[tuple[str, str]] = []
    for row in videos:
        if row.get("is_comment") or row.get("content_type") == "comment":
            continue
        meta = row.get("metadata") or {}
        vid = meta.get("video_id")
        if not vid:
            url = row.get("source_url") or ""
            if "v=" in url:
                vid = url.split("v=")[-1].split("&")[0]
        if vid and len(vid) >= 8:
            video_targets.append((vid, row.get("title") or query))

    video_targets = video_targets[:max_videos]
    if not video_targets:
        return [], {"status": "no_videos"}

    all_rows: list[dict] = []
    stats: dict[str, Any] = {
        "videos_processed": 0,
        "comments_fetched": 0,
        "replies_fetched": 0,
        "comments_disabled_videos": 0,
        "quota_exceeded": False,
    }

    max_workers = max(1, min(cfg["max_concurrent"], len(video_targets)))
    logger.info(
        "youtube.comments.started videos=%s per_video=%s workers=%s",
        len(video_targets),
        comments_per_video,
        max_workers,
    )

    def _worker(target: tuple[str, str]) -> tuple[list[dict], dict]:
        vid, title = target
        local_seen: set[str] = set()
        return _fetch_comments_for_video(
            vid,
            title,
            query,
            comments_per_video=comments_per_video,
            include_replies=include_replies,
            max_replies_per_comment=max_replies,
            seen_ids=local_seen,
        )

    try:
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(_worker, t): t for t in video_targets}
            for future in as_completed(futures):
                try:
                    rows, vstats = future.result()
                    all_rows.extend(rows)
                    stats["videos_processed"] += 1
                    stats["comments_fetched"] += vstats.get("comments_fetched", 0)
                    stats["replies_fetched"] += vstats.get("replies_fetched", 0)
                    if vstats.get("comments_available") is False:
                        stats["comments_disabled_videos"] += 1
                    if vstats.get("quota_exceeded"):
                        stats["quota_exceeded"] = True
                        break
                except YouTubeApiError as exc:
                    if exc.quota_exceeded:
                        stats["quota_exceeded"] = True
                        logger.error("youtube.quota.exceeded during comment fetch")
                        break
                    logger.warning("youtube.comments.video_failed err=%s", exc)
    except Exception as exc:
        logger.warning("youtube.comments.batch_failed err=%s", exc)

    logger.info(
        "youtube.comments.completed comments=%s replies=%s",
        stats["comments_fetched"],
        stats["replies_fetched"],
    )
    # Deduplicate by stable external id across parallel workers
    deduped: list[dict] = []
    seen: set[str] = set()
    for row in all_rows:
        rid = row.get("id") or ""
        if rid and rid in seen:
            continue
        if rid:
            seen.add(rid)
        deduped.append(row)
    return deduped, stats


def search_youtube(
    query: str,
    time_range: str = "7d",
    max_results: int | None = None,
    *,
    crisis_mode: bool = False,
) -> list[dict]:
    """
    Search YouTube for relevant videos and return normalized video mentions.
    Comments are fetched separately via fetch_youtube_audience_content / search_service.
    """
    cfg = _youtube_settings()
    if not cfg["enabled"]:
        logger.info("youtube.search.skipped reason=disabled")
        return []
    if not api_key_configured():
        raise ValueError("YOUTUBE_API_KEY not configured")

    limit = max_results or cfg["max_videos"]
    if crisis_mode:
        limit = min(limit, 3)

    cache_key = _cache_key("search", query, time_range, str(limit), cfg["region_code"])

    def fetch() -> list[dict]:
        try:
            video_ids = _search_video_ids(
                query,
                max_results=limit,
                time_range=time_range,
                region_code=cfg["region_code"],
                relevance_language=cfg["relevance_language"],
            )
            if not video_ids:
                log_platform_success("YouTube", query, 0)
                return []

            details = _fetch_videos_detail(video_ids)
            out: list[dict] = []
            for vid in video_ids:
                item = details.get(vid)
                if not item:
                    continue
                row = _video_metadata_row(
                    video_id=vid,
                    snippet=item.get("snippet") or {},
                    stats=item.get("statistics") or {},
                    content_details=item.get("contentDetails"),
                    query=query,
                )
                if row:
                    out.append(row)

            out = filter_relevant_results(out, query)
            out = sort_results_by_posted_at(out)
            log_platform_success("YouTube", query, len(out))
            return out
        except YouTubeApiError as exc:
            if exc.quota_exceeded:
                logger.error("youtube.quota.exceeded query=%r", query)
            log_platform_error("YouTube", query, exc)
            if exc.quota_exceeded:
                raise ValueError("YouTube quota exceeded") from exc
            return []
        except Exception as exc:
            log_platform_error("YouTube", query, exc)
            return []

    ttl = cfg["cache_ttl"]
    if crisis_mode:
        ttl = min(ttl, 300)
    return cached(cache_key, fetch, ttl_seconds=ttl)


# Backward-compatible alias used by search_service
def fetch_youtube_comments(
    video_ids: list[str],
    query: str,
    *,
    max_per_video: int = 3,
    max_videos: int = 5,
) -> list[dict]:
    """Legacy wrapper — builds stub video rows then fetches audience content."""
    cfg = _youtube_settings()
    stubs = [
        {
            "platform": "youtube",
            "content_type": "video",
            "title": query,
            "metadata": {"video_id": vid},
            "source_url": f"https://www.youtube.com/watch?v={vid}",
        }
        for vid in video_ids[:max_videos]
    ]
    rows, _ = fetch_youtube_audience_content(
        stubs,
        query,
        crisis_mode=max_per_video <= 15,
    )
    return rows


def get_trending_youtube(region_code: str | None = None) -> list[dict]:
    """Fetch trending YouTube videos (News category) for dashboard widgets."""
    cfg = _youtube_settings()
    region = region_code or cfg["region_code"] or "US"
    cache_key = _cache_key("trending", region)

    def fetch() -> list[dict]:
        try:
            data = youtube_get(
                "videos",
                {
                    "part": "snippet,statistics",
                    "chart": "mostPopular",
                    "regionCode": region,
                    "maxResults": 10,
                    "videoCategoryId": "25",
                },
            )
            out = []
            for item in data.get("items") or []:
                vid = item.get("id")
                if not vid:
                    continue
                row = _video_metadata_row(
                    video_id=vid,
                    snippet=item.get("snippet") or {},
                    stats=item.get("statistics") or {},
                    content_details=None,
                    query="trending",
                )
                if row:
                    out.append(row)
            return out
        except Exception as exc:
            log_platform_error("YouTube", "trending", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=600)
