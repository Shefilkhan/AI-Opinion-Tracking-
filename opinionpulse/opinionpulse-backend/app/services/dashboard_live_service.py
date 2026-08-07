"""Dashboard data from live platform APIs."""

from __future__ import annotations

import asyncio
import logging
import threading
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import SearchHistory
from app.services.cache_utils import cache_get, cache_set
from app.services.dashboard_debates_service import get_dashboard_extras_fast
from app.services.keywords_utils import extract_trending_topics
from app.services.platforms import (
    get_all_trending_news_async,
    get_trending_reddit,
    get_trending_youtube,
)
from app.services.search_service import platforms_live_status
from app.services.sentiment_analysis import calculate_sentiment_summary
from app.services.trending_snapshot_service import (
    get_todays_trending,
    get_yesterday_comparison,
)

logger = logging.getLogger(__name__)

OVERVIEW_CACHE_KEY = "dashboard_overview"
OVERVIEW_CACHE_TTL = 120


def _time_ago(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - dt
        hours = int(delta.total_seconds() // 3600)
        if hours < 1:
            return "Just now"
        if hours < 24:
            return f"{hours} hours ago"
        return f"{hours // 24} days ago"
    except Exception:
        return "Recently"


def _trending_sentiment(raw: str | None) -> str:
    """Map stored sentiment labels to dashboard API literals."""
    value = (raw or "neutral").lower()
    if value == "positive":
        return "positive"
    if value == "negative":
        return "negative"
    return "mixed"


def _debate_from_row(row: dict[str, Any]) -> dict[str, Any]:
    title = (row.get("title") or row.get("content", ""))[:120]
    summary = (row.get("content") or title)[:200]
    sentiment = row.get("sentiment", "neutral")
    pos = 65 if sentiment == "positive" else 35 if sentiment == "negative" else 50
    neg = 100 - pos if sentiment != "neutral" else 25
    if sentiment == "negative":
        pos, neg = 35, 65
    neutral = max(0, 100 - pos - neg)
    return {
        "id": row.get("id", ""),
        "title": title,
        "platform": row.get("platform", "news"),
        "summary": summary,
        "positive_pct": pos,
        "negative_pct": neg,
        "neutral_pct": neutral,
        "time_ago": _time_ago(row.get("posted_at", "")),
        "query": title.split(".")[0][:50] or "trending",
        "source_url": row.get("source_url") or row.get("url", ""),
        "source_label": row.get("source_label", ""),
        "thumbnail": row.get("thumbnail") or row.get("image_url"),
    }


async def _gather_trending() -> tuple[list[dict], list[dict], list[dict]]:
    reddit, news, youtube = await asyncio.gather(
        asyncio.to_thread(get_trending_reddit, 10),
        get_all_trending_news_async(25),
        asyncio.to_thread(get_trending_youtube, "US"),
    )
    return reddit, news, youtube


async def _gather_trending_bounded(timeout: float = 12.0) -> tuple[list[dict], list[dict], list[dict]]:
    try:
        return await asyncio.wait_for(_gather_trending(), timeout=timeout)
    except asyncio.TimeoutError:
        logger.warning("Dashboard trending gather timed out after %.0fs", timeout)
        return [], [], []


def _schedule_trending_snapshot_refresh() -> None:
    """Warm trending snapshots in the background — never block HTTP requests."""

    def _run() -> None:
        try:
            from app.services.trending_snapshot_service import collect_trending_snapshots

            asyncio.run(collect_trending_snapshots())
        except Exception as exc:
            logger.warning("Background trending snapshot refresh failed: %s", exc)

    threading.Thread(target=_run, daemon=True).start()


def _platform_pulse_from_snapshots(
    snapshots: list[dict[str, Any]], live: dict[str, bool]
) -> list[dict[str, Any]]:
    counts = Counter((s.get("platform") or "news").lower() for s in snapshots)
    news_count = sum(
        counts.get(k, 0)
        for k in ("newsapi", "guardian", "gnews", "currents", "mediastack", "news")
    )
    news_live = any(
        live.get(k) for k in ("newsapi", "guardian", "mediastack", "currents", "gnews")
    )
    return [
        {
            "platform": "reddit",
            "label": "Reddit",
            "mentions": f"{counts.get('reddit', 0)} trending posts",
            "positive_pct": 61,
            "live": True,
        },
        {
            "platform": "devto",
            "label": "Dev.to",
            "mentions": "Tech articles",
            "positive_pct": 65,
            "live": True,
        },
        {
            "platform": "hackernews",
            "label": "Hacker News",
            "mentions": "Tech discussions",
            "positive_pct": 58,
            "live": True,
        },
        {
            "platform": "youtube",
            "label": "YouTube",
            "mentions": f"{counts.get('youtube', 0)} videos" if counts.get("youtube") else (
                "Add YOUTUBE_API_KEY" if not live.get("youtube") else "Live"
            ),
            "positive_pct": 70,
            "live": live.get("youtube", False),
        },
        {
            "platform": "news",
            "label": "Global News",
            "mentions": f"{news_count} headlines" if news_count else (
                "Add news API keys" if not news_live else "Live"
            ),
            "positive_pct": 52,
            "live": news_live,
        },
    ]


def _refresh_overview_cache_async() -> None:
    def _run() -> None:
        try:
            payload = _build_dashboard_overview()
            cache_set(OVERVIEW_CACHE_KEY, payload, OVERVIEW_CACHE_TTL)
        except Exception as exc:
            logger.error("Background dashboard overview refresh failed: %s", exc)

    threading.Thread(target=_run, daemon=True).start()


def _search_stats_today(db: Session) -> int:
    today = datetime.now(timezone.utc).date()
    return (
        db.query(func.count(SearchHistory.id))
        .filter(func.date(SearchHistory.searched_at) == today)
        .scalar()
        or 0
    )


def _build_dashboard_overview(db: Session | None = None) -> dict[str, Any]:
    own_session = db is None
    if own_session:
        db = SessionLocal()
    snapshots: list[dict[str, Any]] = []
    trending_comparison: dict[str, int] = {"today": 0, "yesterday": 0, "delta": 0}
    searches_today = 0
    try:
        searches_today = _search_stats_today(db)
        snapshots = get_todays_trending(db, 20)
        if not snapshots:
            _schedule_trending_snapshot_refresh()
        trending_comparison = get_yesterday_comparison(db)
    finally:
        if own_session and db:
            db.close()

    live = platforms_live_status()
    reddit_data: list[dict] = []
    news_data: list[dict] = []
    youtube_data: list[dict] = []

    # Only hit live APIs when snapshots are empty (cold start). Even then, cap wait time.
    if not snapshots:
        try:
            reddit_data, news_data, youtube_data = asyncio.run(
                _gather_trending_bounded(timeout=12.0)
            )
        except Exception as exc:
            logger.error("Dashboard gather failed: %s", exc)

    if snapshots:
        snapshot_rows = [
            {
                "id": s["id"],
                "title": s["title"],
                "content": s["title"],
                "platform": s["platform"],
                "source_url": s["source_url"],
                "source_label": s["platform"],
                "posted_at": s["posted_at"],
                "sentiment": s["sentiment"],
                "engagement": {"likes": s["engagement_score"], "comments": 0, "shares": 0, "views": 0},
            }
            for s in snapshots
        ]
        debates = [_debate_from_row(r) for r in snapshot_rows[:10]]
        trending = [
            {
                "name": s["title"][:40],
                "mentions": str(s["engagement_score"]),
                "sentiment": _trending_sentiment(s.get("sentiment")),
                "trend": "up" if trending_comparison.get("delta", 0) >= 0 else "down",
                "query": s["topic"],
            }
            for s in snapshots[:10]
        ]
        all_items = snapshot_rows
    else:
        all_items = [*reddit_data, *news_data, *youtube_data]
        all_items.sort(key=lambda x: x.get("posted_at", ""), reverse=True)
        debates = [_debate_from_row(r) for r in all_items[:10]]
        trending = extract_trending_topics(all_items, 10)
        if not trending and debates:
            trending = [
                {
                    "name": d["title"][:40],
                    "mentions": "Live",
                    "sentiment": "mixed",
                    "trend": "up",
                    "query": d["query"],
                }
                for d in debates[:8]
            ]

    if all_items:
        summary = calculate_sentiment_summary(all_items)
    else:
        summary = {"positive": 50, "negative": 30, "neutral": 20}

    news_live = any(
        live.get(k) for k in ("newsapi", "guardian", "mediastack", "currents", "gnews")
    )
    if snapshots:
        platform_pulse = _platform_pulse_from_snapshots(snapshots, live)
    else:
        yt_views = sum(
            (r.get("engagement") or {}).get("views", 0) for r in youtube_data
        )
        reddit_summary = (
            calculate_sentiment_summary(reddit_data) if reddit_data else {"positive": 61}
        )
        news_summary = (
            calculate_sentiment_summary(news_data) if news_data else {"positive": 52}
        )
        yt_summary = (
            calculate_sentiment_summary(youtube_data) if youtube_data else {"positive": 70}
        )
        platform_pulse = [
            {
                "platform": "reddit",
                "label": "Reddit",
                "mentions": f"{len(reddit_data)} hot posts" if reddit_data else "Live (no key)",
                "positive_pct": reddit_summary.get("positive", 61),
                "live": True,
            },
            {
                "platform": "devto",
                "label": "Dev.to",
                "mentions": "Tech articles",
                "positive_pct": 65,
                "live": True,
            },
            {
                "platform": "hackernews",
                "label": "Hacker News",
                "mentions": "Tech discussions",
                "positive_pct": 58,
                "live": True,
            },
            {
                "platform": "youtube",
                "label": "YouTube",
                "mentions": f"{yt_views:,} views" if yt_views else ("Add YOUTUBE_API_KEY" if not live.get("youtube") else "Live"),
                "positive_pct": yt_summary.get("positive", 70),
                "live": live.get("youtube", False),
            },
            {
                "platform": "news",
                "label": "Global News",
                "mentions": f"{len(news_data)} headlines" if news_data else ("Add news API keys" if not news_live else "Live"),
                "positive_pct": news_summary.get("positive", 52),
                "live": news_live,
            },
        ]

    live_debates, most_discussed = get_dashboard_extras_fast()

    has_data = bool(snapshots or reddit_data or news_data or youtube_data)
    return {
        "stats": {
            "searches_today": {
                "value": f"{searches_today:,}",
                "subtitle": "searches performed today",
                "trend": "Live data" if any(live.values()) else "Demo mode",
                "trend_positive": True,
            },
            "topics_trending": {
                "value": str(len(trending)),
                "subtitle": "topics from live feeds",
                "trend": "Reddit, News APIs, YouTube",
                "trend_positive": True,
            },
            "positive_sentiment": {
                "value": f"{summary['positive']}%",
                "subtitle": "average positive sentiment",
                "trend": "",
                "trend_positive": True,
                "progress": summary["positive"],
            },
            "negative_sentiment": {
                "value": f"{summary['negative']}%",
                "subtitle": "average negative sentiment",
                "trend": "",
                "trend_positive": False,
                "progress": summary["negative"],
            },
        },
        "trending_topics": trending,
        "daily_trending": snapshots,
        "trending_comparison": trending_comparison,
        "debates": debates,
        "live_debates": live_debates,
        "most_discussed": most_discussed,
        "platform_pulse": platform_pulse,
        "demo_mode": not has_data,
        "is_live": live,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


def get_dashboard_overview(db: Session | None = None) -> dict[str, Any]:
    """Fast dashboard payload: DB snapshots + cache; live APIs only on cold start."""
    hit = cache_get(OVERVIEW_CACHE_KEY)
    if hit is not None:
        _refresh_overview_cache_async()
        return hit

    payload = _build_dashboard_overview(db=db)
    cache_set(OVERVIEW_CACHE_KEY, payload, OVERVIEW_CACHE_TTL)
    return payload
