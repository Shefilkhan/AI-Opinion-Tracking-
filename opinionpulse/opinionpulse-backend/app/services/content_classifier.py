"""Classify search results by content type (comment, post, reel, etc.)."""

from __future__ import annotations

from typing import Any


def classify_content_type(result: dict[str, Any]) -> str:
    """
    Classify result as comment/post/reel/image/article/video
    based on platform + metadata signals.
    """
    platform = result.get("platform", "")
    url = result.get("url", "") or result.get("source_url", "") or ""
    content = result.get("content", "") or ""

    if platform == "youtube":
        if "shorts" in url.lower():
            return "reel"
        return "video"

    if platform == "reddit":
        if result.get("is_comment") or "/comment/" in url:
            return "comment"
        if len(content) < 100:
            return "comment"
        return "post"

    if platform in ("bluesky", "mastodon"):
        if len(content) < 280:
            return "comment"
        return "post"

    if platform == "github":
        meta = result.get("metadata", {})
        if meta.get("type") == "issue":
            return "post"
        return "comment"

    if platform in ("newsapi", "news", "guardian", "gnews", "currents", "mediastack"):
        return "article"

    if platform in ("hackernews", "devto"):
        return "post"

    return "post"
