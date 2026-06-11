"""Shared helpers for normalizing platform search results."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import requests

from app.services.sentiment_analysis import analyze_sentiment

logger = logging.getLogger(__name__)

PUBLICATION_NAMES = {
    "reddit": "Reddit",
    "youtube": "YouTube",
    "news": "News",
    "guardian": "The Guardian",
    "devto": "Dev.to",
    "hackernews": "Hacker News",
}


def validate_url(url: str, query: str, platform: str) -> str:
    """Return a safe URL or empty string (caller should skip the row)."""
    if not url or not isinstance(url, str):
        logger.warning("⚠️ Missing URL for %s query=%r", platform, query)
        return ""
    lower = url.lower()
    if "/example/" in lower or "/placeholder/" in lower or "/fake/" in lower:
        logger.warning("⚠️ FAKE URL detected in %s: %s", platform, url)
        return ""
    if "example.com" in lower:
        logger.warning("⚠️ FAKE URL detected in %s: %s", platform, url)
        return ""
    if not lower.startswith("http"):
        return ""
    return url


def build_result(
    *,
    id: str,
    platform: str,
    author: str,
    title: str,
    content: str,
    source_url: str,
    source_label: str,
    query: str,
    posted_at: str | None = None,
    publication: str | None = None,
    image_url: str | None = None,
    engagement: dict[str, int] | None = None,
    sentiment_text: str | None = None,
) -> dict[str, Any] | None:
    """Build a normalized result dict; returns None if URL is invalid."""
    title = (title or "").strip()
    content = (content or title or "").strip()[:350]
    if not title:
        return None

    safe_url = validate_url(source_url, query, platform)
    if not safe_url:
        return None

    text = sentiment_text if sentiment_text is not None else f"{title} {content}"
    analysis = analyze_sentiment(text)
    pub = publication or PUBLICATION_NAMES.get(platform, platform.title())
    eng = engagement or {"likes": 0, "shares": 0, "comments": 0, "views": 0}

    return {
        "id": id,
        "platform": platform,
        "author": author or pub,
        "title": title,
        "content": content,
        "source_url": safe_url,
        "url": safe_url,
        "source_label": source_label or pub,
        "publication": pub,
        "image_url": image_url,
        "thumbnail": image_url,
        "posted_at": posted_at or datetime.now(timezone.utc).isoformat(),
        "sentiment": analysis["sentiment"],
        "sentiment_score": float(analysis["score"]),
        "engagement": {
            "likes": int(eng.get("likes") or 0),
            "shares": int(eng.get("shares") or 0),
            "comments": int(eng.get("comments") or 0),
            "views": int(eng.get("views") or 0),
        },
        "is_demo": False,
    }


def normalize_result(row: dict[str, Any], query: str = "") -> dict[str, Any] | None:
    """Ensure every field exists and URLs are valid."""
    source_url = row.get("source_url") or row.get("url") or ""
    platform = row.get("platform") or "news"
    title = row.get("title") or row.get("content") or ""
    content = row.get("content") or title

    if row.get("sentiment") and row.get("source_url"):
        safe = validate_url(source_url, query, platform)
        if not safe:
            return None
        out = dict(row)
        out["source_url"] = safe
        out["url"] = safe
        out.setdefault("publication", PUBLICATION_NAMES.get(platform, platform))
        out.setdefault("image_url", out.get("thumbnail"))
        out.setdefault("thumbnail", out.get("image_url"))
        eng = out.get("engagement") or {}
        out["engagement"] = {
            "likes": int(eng.get("likes") or 0),
            "shares": int(eng.get("shares") or 0),
            "comments": int(eng.get("comments") or 0),
            "views": int(eng.get("views") or 0),
        }
        return out

    return build_result(
        id=str(row.get("id") or ""),
        platform=platform,
        author=str(row.get("author") or ""),
        title=str(title),
        content=str(content),
        source_url=str(source_url),
        source_label=str(row.get("source_label") or ""),
        query=query,
        posted_at=row.get("posted_at"),
        publication=row.get("publication"),
        image_url=row.get("image_url") or row.get("thumbnail"),
        engagement=row.get("engagement"),
        sentiment_text=row.get("sentiment_text"),
    )


def deduplicate_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen_titles: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for result in results:
        title = result.get("title") or result.get("content") or ""
        key = "".join(c for c in title.lower() if c.isalnum())[:50]
        if not key or key in seen_titles:
            continue
        seen_titles.add(key)
        deduped.append(result)
    return deduped


def log_platform_success(platform: str, query: str, count: int) -> None:
    logger.info("%s: %d results for '%s'", platform, count, query)


def log_platform_error(platform: str, query: str, err: Exception) -> None:
    if isinstance(err, requests.Timeout):
        logger.error("%s: timeout for '%s'", platform, query)
    elif isinstance(err, requests.HTTPError):
        status = err.response.status_code if err.response is not None else "?"
        logger.error("%s: HTTP %s for '%s'", platform, status, query)
    else:
        logger.error("%s: unexpected error for '%s': %s", platform, query, err)

