"""Live debates and most-discussed topics for the dashboard."""

from __future__ import annotations

import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Any

from app.db.database import SessionLocal
from app.services.cache_utils import cache_get, cache_set
from app.services.platform_rate_limit import is_rate_limited
from app.services.platforms import (
    get_all_trending_news_async,
    get_trending_reddit,
    get_trending_youtube,
)
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    sort_results_by_posted_at,
)
from app.services.sentiment_analysis import calculate_sentiment_summary
from app.services.trending_snapshot_service import get_discovered_topics, _extract_topic
from app.services.search_service import search_all_platforms

logger = logging.getLogger(__name__)

CACHE_TTL = 300
FETCH_TIMEOUT = 25.0
OVERVIEW_EXTRAS_WAIT = 18.0
LIVE_DEBATE_WINDOW = "1h"
_DASHBOARD_SEARCH_SEM = threading.Semaphore(2)

DASHBOARD_SOURCE_ALLOWLIST = [
    "reddit",
    "newsapi",
    "guardian",
    "gnews",
    "currents",
    "hackernews",
    "devto",
    "stackoverflow",
    "bluesky",
    "mastodon",
]


def _dashboard_sources() -> list[str]:
    """Omit rate-limited upstreams so dashboard scans don't amplify 429 storms."""
    blocked = {"reddit", "gnews"}
    return [
        s
        for s in DASHBOARD_SOURCE_ALLOWLIST
        if not (s in blocked and is_rate_limited(s))
    ]


async def _dashboard_search(query: str, time_range: str) -> list[dict[str, Any]]:
    await asyncio.to_thread(_DASHBOARD_SEARCH_SEM.acquire)
    try:
        results = await search_all_platforms(
            query,
            time_range,
            fetch_timeout=FETCH_TIMEOUT,
            source_allowlist=_dashboard_sources(),
        )
        return filter_by_time_range(results, time_range, fallback_to_all=True)
    finally:
        _DASHBOARD_SEARCH_SEM.release()


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
        minutes = int(delta.total_seconds() // 60)
        if minutes < 1:
            return "Just now"
        if minutes < 60:
            return f"{minutes}m ago"
        hours = minutes // 60
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
        "thumbnail": row.get("thumbnail") or row.get("image_url"),
    }


def _debate_topics() -> list[str]:
    with SessionLocal() as db:
        discovered = get_discovered_topics(db, limit=5)
    return discovered if discovered else DEBATE_TOPICS[:5]


def _most_discussed_queries() -> list[str]:
    with SessionLocal() as db:
        discovered = get_discovered_topics(db, limit=8)
    return discovered if discovered else MOST_DISCUSSED_QUERIES[:8]


def _debate_from_results(topic: str, results: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not results:
        return None

    positive = sum(1 for r in results if r.get("sentiment") == "positive")
    negative = sum(1 for r in results if r.get("sentiment") == "negative")
    total = len(results)
    pos_pct = round((positive / total) * 100)
    neg_pct = round((negative / total) * 100)
    neu_pct = max(0, 100 - pos_pct - neg_pct)

    platforms = list({r.get("platform", "") for r in results if r.get("platform")})
    top_result = max(results, key=_engagement_score)
    total_engagement = sum(_engagement_score(r) for r in results)
    is_heated = pos_pct >= 15 and neg_pct >= 15 and abs(pos_pct - neg_pct) < 30

    return {
        "topic": topic,
        "headline": top_result.get("title", topic),
        "summary": (top_result.get("content") or "")[:200],
        "source_url": top_result.get("source_url", ""),
        "source_label": top_result.get("source_label", ""),
        "thumbnail": top_result.get("thumbnail") or top_result.get("image_url"),
        "platforms": platforms[:4],
        "total_mentions": total,
        "total_engagement": total_engagement,
        "sentiment": {
            "positive": pos_pct,
            "negative": neg_pct,
            "neutral": neu_pct,
        },
        "top_results": [_trim_result(r) for r in results[:3]],
        "is_heated": is_heated,
        "posted_at": top_result.get("posted_at", ""),
        "time_ago": _time_ago(top_result.get("posted_at", "")),
    }


async def _fetch_last_hour_trending() -> list[dict[str, Any]]:
    """Fast live pull from trending endpoints, trimmed to the last hour."""
    try:
        reddit, news, youtube = await asyncio.wait_for(
            asyncio.gather(
                asyncio.to_thread(get_trending_reddit, 15),
                get_all_trending_news_async(25),
                asyncio.to_thread(get_trending_youtube, "US"),
            ),
            timeout=15.0,
        )
    except asyncio.TimeoutError:
        logger.warning("Live debate trending fetch timed out")
        return []

    combined = sort_results_by_posted_at([*reddit, *news, *youtube])
    recent = filter_by_time_range(combined, LIVE_DEBATE_WINDOW, fallback_to_all=False)
    if len(recent) < 5:
        recent = filter_by_time_range(combined, LIVE_DEBATE_WINDOW, fallback_to_all=True)
    return recent


def _debates_from_trending(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Cluster last-hour headlines into debate cards."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for row in items:
        title = (row.get("title") or row.get("content") or "").strip()
        if not title:
            continue
        topic = _extract_topic(title)
        groups.setdefault(topic, []).append(row)

    debates: list[dict[str, Any]] = []
    for topic, results in groups.items():
        debate = _debate_from_results(topic.title(), results)
        if debate and debate["total_mentions"] >= 1:
            debates.append(debate)

    debates.sort(
        key=lambda d: (d["is_heated"], d["total_mentions"], d["total_engagement"]),
        reverse=True,
    )
    return debates


async def _build_live_debates() -> list[dict[str, Any]]:
    """Trending debates from the last hour — fast feed first, topic search as fallback."""
    trending_items = await _fetch_last_hour_trending()
    debates = _debates_from_trending(trending_items)

    if len(debates) >= 3:
        return debates[:6]

    seen_topics = {d["topic"].lower() for d in debates}
    for topic in _debate_topics()[:3]:
        if topic.lower() in seen_topics:
            continue
        results = await _dashboard_search(topic, LIVE_DEBATE_WINDOW)
        if len(results) < 2:
            continue
        debate = _debate_from_results(topic, results)
        if debate:
            debates.append(debate)
            seen_topics.add(topic.lower())
        if len(debates) >= 6:
            break

    debates.sort(
        key=lambda d: (d["is_heated"], d["total_mentions"], d["total_engagement"]),
        reverse=True,
    )
    return debates[:6]


async def _build_most_discussed() -> list[dict[str, Any]]:
    queries = _most_discussed_queries()[:3]
    discussed: list[dict[str, Any]] = []
    for query in queries:
        results = await _dashboard_search(query, "7d")
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


def _run_coro(coro):
    """Run a coroutine to completion from sync OR async call sites."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    box: dict[str, Any] = {}

    def _worker() -> None:
        try:
            box["value"] = asyncio.run(coro)
        except BaseException as exc:  # noqa: BLE001 — re-raised below
            box["error"] = exc

    thread = threading.Thread(target=_worker)
    thread.start()
    thread.join()
    if "error" in box:
        raise box["error"]
    return box["value"]


def _cached_list(key: str, builder) -> list[dict[str, Any]]:
    hit = cache_get(key)
    if hit is not None:
        _refresh_cache_async(key, builder)
        return hit
    data = _run_coro(builder())
    cache_set(key, data, CACHE_TTL)
    return data


def get_live_debates() -> list[dict[str, Any]]:
    hit = cache_get("dashboard_debates")
    if hit is not None:
        _refresh_cache_async("dashboard_debates", _build_live_debates)
        return hit
    debates = _run_coro(_build_live_debates())
    cache_set("dashboard_debates", debates, CACHE_TTL)
    return debates


def get_most_discussed() -> list[dict[str, Any]]:
    hit = cache_get("dashboard_most_discussed")
    if hit is not None:
        _refresh_cache_async("dashboard_most_discussed", _build_most_discussed)
        return hit
    most = _run_coro(_build_most_discussed())
    cache_set("dashboard_most_discussed", most, CACHE_TTL)
    return most


async def _fetch_both_parallel() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    debates = await _build_live_debates()
    most = await _build_most_discussed()
    return debates, most


def get_dashboard_extras_fast() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return debates/most-discussed; bounded wait so overview API stays fast."""
    d_hit = cache_get("dashboard_debates")
    m_hit = cache_get("dashboard_most_discussed")
    if d_hit is not None and m_hit is not None:
        _refresh_cache_async("dashboard_debates", _build_live_debates)
        _refresh_cache_async("dashboard_most_discussed", _build_most_discussed)
        return d_hit, m_hit

    async def _bounded() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        return await asyncio.wait_for(
            _fetch_both_parallel(),
            timeout=OVERVIEW_EXTRAS_WAIT,
        )

    try:
        debates, most = _run_coro(_bounded())
        cache_set("dashboard_debates", debates, CACHE_TTL)
        cache_set("dashboard_most_discussed", most, CACHE_TTL)
        return debates, most
    except (asyncio.TimeoutError, TimeoutError):
        logger.warning(
            "Dashboard extras timed out after %.0fs — overview returns without blocking",
            OVERVIEW_EXTRAS_WAIT,
        )
        _refresh_cache_async("dashboard_debates", _build_live_debates)
        _refresh_cache_async("dashboard_most_discussed", _build_most_discussed)
        return d_hit or [], m_hit or []


def get_dashboard_extras() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return (live_debates, most_discussed) with shared parallel fetch on cache miss."""
    d_hit = cache_get("dashboard_debates")
    m_hit = cache_get("dashboard_most_discussed")
    if d_hit is not None and m_hit is not None:
        _refresh_cache_async("dashboard_debates", _build_live_debates)
        _refresh_cache_async("dashboard_most_discussed", _build_most_discussed)
        return d_hit, m_hit

    debates, most = _run_coro(_fetch_both_parallel())
    cache_set("dashboard_debates", debates, CACHE_TTL)
    cache_set("dashboard_most_discussed", most, CACHE_TTL)
    return debates, most
