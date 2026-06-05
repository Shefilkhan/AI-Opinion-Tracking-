"""Live debates and most-discussed topics for the dashboard."""

from __future__ import annotations

import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Any

from app.services.cache_utils import cache_get, cache_set
from app.services.search_service import search_all_platforms
from app.services.sentiment_analysis import calculate_sentiment_summary

logger = logging.getLogger(__name__)

CACHE_TTL = 300
FETCH_TIMEOUT = 6.0

DEBATE_TOPICS = [
    "AI regulation",
    "Bitcoin price",
    "climate policy",
    "remote work",
    "electric vehicles",
    "cryptocurrency",
    "social media ban",
    "nuclear energy",
    "immigration",
    "stock market",
]

MOST_DISCUSSED_QUERIES = [
    "artificial intelligence",
    "bitcoin",
    "climate change",
    "elections",
    "economy",
    "technology",
    "health",
    "social media",
    "space",
    "energy",
]

TOPIC_EMOJI: dict[str, str] = {
    "artificial intelligence": "🤖",
    "bitcoin": "₿",
    "climate change": "🌍",
    "elections": "🗳️",
    "economy": "📊",
    "technology": "💻",
    "health": "🏥",
    "social media": "📱",
    "space": "🚀",
    "energy": "⚡",
}


def _time_ago(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - dt
        hours = int(delta.total_seconds() // 3600)
        if hours < 1:
            return "Just now"
        if hours < 24:
            return f"{hours}h ago"
        return f"{hours // 24}d ago"
    except Exception:
        return "Recently"


def _engagement_score(row: dict[str, Any]) -> int:
    eng = row.get("engagement") or {}
    return int(eng.get("comments") or 0) + int(eng.get("likes") or 0) + int(
        eng.get("shares") or 0
    )


def _trim_result(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "platform": row.get("platform", ""),
        "title": (row.get("title") or "")[:120],
        "content": (row.get("content") or "")[:200],
        "source_url": row.get("source_url", ""),
        "source_label": row.get("source_label", ""),
        "posted_at": row.get("posted_at", ""),
        "sentiment": row.get("sentiment", "neutral"),
        "engagement": row.get("engagement") or {},
    }


async def _build_live_debates() -> list[dict[str, Any]]:
    topics = DEBATE_TOPICS[:5]
    topic_results = await asyncio.gather(
        *[search_all_platforms(t, "24h", fetch_timeout=FETCH_TIMEOUT) for t in topics]
    )

    debates: list[dict[str, Any]] = []
    for topic, results in zip(topics, topic_results):
        if len(results) < 5:
            continue

        positive = sum(1 for r in results if r.get("sentiment") == "positive")
        negative = sum(1 for r in results if r.get("sentiment") == "negative")
        total = len(results)
        pos_pct = round((positive / total) * 100)
        neg_pct = round((negative / total) * 100)
        neu_pct = max(0, 100 - pos_pct - neg_pct)

        if pos_pct < 20 or neg_pct < 20:
            continue
        if pos_pct > 70 or neg_pct > 70:
            continue

        platforms = list({r.get("platform", "") for r in results if r.get("platform")})
        if len(platforms) < 2:
            continue

        top_result = max(results, key=_engagement_score)
        total_engagement = sum(_engagement_score(r) for r in results)

        debates.append(
            {
                "topic": topic,
                "headline": top_result.get("title", topic),
                "summary": (top_result.get("content") or "")[:200],
                "source_url": top_result.get("source_url", ""),
                "source_label": top_result.get("source_label", ""),
                "platforms": platforms[:4],
                "total_mentions": total,
                "total_engagement": total_engagement,
                "sentiment": {
                    "positive": pos_pct,
                    "negative": neg_pct,
                    "neutral": neu_pct,
                },
                "top_results": [_trim_result(r) for r in results[:3]],
                "is_heated": abs(pos_pct - neg_pct) < 20,
                "posted_at": top_result.get("posted_at", ""),
                "time_ago": _time_ago(top_result.get("posted_at", "")),
            }
        )

    debates.sort(
        key=lambda d: (d["is_heated"], d["total_mentions"], d["total_engagement"]),
        reverse=True,
    )
    return debates[:6]


async def _build_most_discussed() -> list[dict[str, Any]]:
    queries = MOST_DISCUSSED_QUERIES[:8]
    query_results = await asyncio.gather(
        *[search_all_platforms(q, "7d", fetch_timeout=FETCH_TIMEOUT) for q in queries]
    )

    discussed: list[dict[str, Any]] = []
    for query, results in zip(queries, query_results):
        if not results:
            continue

        total_likes = sum((r.get("engagement") or {}).get("likes", 0) for r in results)
        total_comments = sum(
            (r.get("engagement") or {}).get("comments", 0) for r in results
        )
        total_engagement = int(total_likes) + int(total_comments)
        sentiment_summary = calculate_sentiment_summary(results)

        platform_counts: dict[str, int] = {}
        for r in results:
            p = r.get("platform") or "unknown"
            platform_counts[p] = platform_counts.get(p, 0) + 1

        top_platform = (
            max(platform_counts, key=platform_counts.get)
            if platform_counts
            else "reddit"
        )

        discussed.append(
            {
                "topic": query.title(),
                "query": query,
                "emoji": TOPIC_EMOJI.get(query, "💬"),
                "total_mentions": len(results),
                "total_engagement": total_engagement,
                "sentiment": sentiment_summary,
                "top_platform": top_platform,
                "platform_breakdown": platform_counts,
                "trend": "up" if total_engagement > 1000 else "stable",
                "top_result": _trim_result(results[0]) if results else None,
            }
        )

    discussed.sort(key=lambda d: d["total_engagement"], reverse=True)
    return discussed[:8]


def _refresh_cache_async(key: str, builder) -> None:
    """Refresh cache in a background thread (stale-while-revalidate)."""

    def _run() -> None:
        try:
            data = asyncio.run(builder())
            cache_set(key, data, CACHE_TTL)
        except Exception as exc:
            logger.error("Background cache refresh failed for %s: %s", key, exc)

    threading.Thread(target=_run, daemon=True).start()


def _cached_list(key: str, builder) -> list[dict[str, Any]]:
    hit = cache_get(key)
    if hit is not None:
        _refresh_cache_async(key, builder)
        return hit
    data = asyncio.run(builder())
    cache_set(key, data, CACHE_TTL)
    return data


def get_live_debates() -> list[dict[str, Any]]:
    return _cached_list("dashboard_debates", _build_live_debates)


def get_most_discussed() -> list[dict[str, Any]]:
    return _cached_list("dashboard_most_discussed", _build_most_discussed)


async def _fetch_both_parallel() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    results = await asyncio.gather(
        _build_live_debates(),
        _build_most_discussed(),
        return_exceptions=True,
    )
    debates = results[0] if not isinstance(results[0], Exception) else []
    if isinstance(results[0], Exception):
        logger.error("Live debates fetch failed: %s", results[0])
    most = results[1] if not isinstance(results[1], Exception) else []
    if isinstance(results[1], Exception):
        logger.error("Most discussed fetch failed: %s", results[1])
    return debates, most


def get_dashboard_extras() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return (live_debates, most_discussed) with shared parallel fetch on cache miss."""
    d_hit = cache_get("dashboard_debates")
    m_hit = cache_get("dashboard_most_discussed")
    if d_hit is not None and m_hit is not None:
        _refresh_cache_async("dashboard_debates", _build_live_debates)
        _refresh_cache_async("dashboard_most_discussed", _build_most_discussed)
        return d_hit, m_hit

    debates, most = asyncio.run(_fetch_both_parallel())
    cache_set("dashboard_debates", debates, CACHE_TTL)
    cache_set("dashboard_most_discussed", most, CACHE_TTL)
    return debates, most
