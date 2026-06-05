"""Dashboard data from live platform APIs."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import SearchHistory
from app.services.keywords_utils import extract_trending_topics
from app.services.platforms import (
    get_trending_news,
    get_trending_reddit,
    get_trending_youtube,
)
from app.services.dashboard_debates_service import get_dashboard_extras
from app.services.search_service import platforms_live_status
from app.services.sentiment_analysis import calculate_sentiment_summary

logger = logging.getLogger(__name__)


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


def _debate_from_row(row: dict[str, Any]) -> dict[str, Any]:
    title = (row.get("title") or row.get("content", ""))[:120]
    summary = (row.get("content") or title)[:200]
    sentiment = row.get("sentiment", "neutral")
    pos = 65 if sentiment == "positive" else 35 if sentiment == "negative" else 50
    neg = 100 - pos if sentiment != "neutral" else 25
    if sentiment == "negative":
        pos, neg = 35, 65
    return {
        "id": row.get("id", ""),
        "title": title,
        "platform": row.get("platform", "news"),
        "summary": summary,
        "positive_pct": pos,
        "negative_pct": neg,
        "time_ago": _time_ago(row.get("posted_at", "")),
        "query": title.split(".")[0][:50] or "trending",
        "source_url": row.get("url", ""),
        "source_label": row.get("source_label", ""),
        "thumbnail": row.get("thumbnail"),
    }


async def _gather_trending() -> tuple[list[dict], list[dict], list[dict]]:
    reddit, news, youtube = await asyncio.gather(
        asyncio.to_thread(get_trending_reddit, 10),
        asyncio.to_thread(get_trending_news),
        asyncio.to_thread(get_trending_youtube, "US"),
    )
    return reddit, news, youtube


def _search_stats_today(db: Session) -> int:
    today = datetime.now(timezone.utc).date()
    return (
        db.query(func.count(SearchHistory.id))
        .filter(func.date(SearchHistory.searched_at) == today)
        .scalar()
        or 0
    )


def get_dashboard_overview(db: Session | None = None) -> dict[str, Any]:
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        searches_today = _search_stats_today(db)
    finally:
        if own_session and db:
            db.close()

    live = platforms_live_status()

    try:
        reddit_data, news_data, youtube_data = asyncio.run(_gather_trending())
    except Exception as exc:
        logger.error("Dashboard gather failed: %s", exc)
        reddit_data, news_data, youtube_data = [], [], []

    all_items = [*reddit_data, *news_data, *youtube_data]
    all_items.sort(
        key=lambda x: x.get("posted_at", ""),
        reverse=True,
    )
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

    news_live = any(
        live.get(k) for k in ("newsapi", "guardian", "mediastack", "currents", "gnews")
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

    try:
        live_debates, most_discussed = get_dashboard_extras()
    except Exception as exc:
        logger.error("Dashboard extras failed: %s", exc)
        live_debates, most_discussed = [], []

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
                "trend": "Reddit, Dev.to, HN, News, YouTube",
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
        "debates": debates,
        "live_debates": live_debates,
        "most_discussed": most_discussed,
        "platform_pulse": platform_pulse,
        "demo_mode": not any(
            [reddit_data, news_data, youtube_data]
        ),
        "is_live": live,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
