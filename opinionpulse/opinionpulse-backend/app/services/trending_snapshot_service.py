"""Collect and serve daily trending news snapshots for the dashboard."""

from __future__ import annotations

import asyncio
import logging
import re
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import TrendingSnapshot
from app.services.platforms import get_all_trending_news_async, get_trending_reddit
from app.services.platforms.query_helpers import parse_posted_at, sort_results_by_posted_at
from app.services.source_quality import engagement_total, normalize_url

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "about",
    "after", "over", "under", "your", "their", "will", "have", "been",
}


def _extract_topic(title: str) -> str:
    """Derive a short topic label from a headline."""
    cleaned = re.sub(r"[^\w\s]", " ", title.lower())
    words = [w for w in cleaned.split() if len(w) > 3 and w not in STOP_WORDS]
    return " ".join(words[:4]) or title[:60].lower()


def _row_to_snapshot(row: dict[str, Any], snapshot_date: date) -> TrendingSnapshot | None:
    url = row.get("source_url") or row.get("url") or ""
    title = (row.get("title") or row.get("content") or "").strip()
    if not url or not title:
        return None
    posted = parse_posted_at(row.get("posted_at"))
    return TrendingSnapshot(
        snapshot_date=snapshot_date,
        topic=_extract_topic(title),
        title=title[:300],
        platform=row.get("platform") or "news",
        source_url=url[:512],
        author=(row.get("author") or "")[:255] or None,
        sentiment=row.get("sentiment"),
        engagement_score=engagement_total(row),
        posted_at=posted,
    )


async def collect_trending_snapshots() -> int:
    """Fetch live trending headlines and upsert today's snapshot rows."""
    today = datetime.now(timezone.utc).date()
    try:
        reddit, news = await asyncio.gather(
            asyncio.to_thread(get_trending_reddit, 15),
            get_all_trending_news_async(30),
        )
    except Exception as exc:
        logger.error("Trending snapshot fetch failed: %s", exc)
        return 0

    combined = sort_results_by_posted_at([*reddit, *news])
    seen_urls: set[str] = set()
    rows: list[TrendingSnapshot] = []
    for item in combined:
        url_key = normalize_url(item.get("source_url") or item.get("url") or "")
        if not url_key or url_key in seen_urls:
            continue
        snap = _row_to_snapshot(item, today)
        if snap:
            rows.append(snap)
            seen_urls.add(url_key)
        if len(rows) >= 40:
            break

    if not rows:
        return 0

    with SessionLocal() as db:
        for snap in rows:
            existing = (
                db.query(TrendingSnapshot)
                .filter(
                    TrendingSnapshot.snapshot_date == today,
                    TrendingSnapshot.source_url == snap.source_url,
                )
                .first()
            )
            if existing:
                existing.title = snap.title
                existing.topic = snap.topic
                existing.engagement_score = snap.engagement_score
                existing.sentiment = snap.sentiment
                existing.posted_at = snap.posted_at
                existing.fetched_at = datetime.now(timezone.utc)
            else:
                db.add(snap)
        db.commit()
    logger.info("Trending snapshots: saved %s items for %s", len(rows), today)
    return len(rows)


def get_todays_trending(db: Session, limit: int = 20) -> list[dict[str, Any]]:
    """Return today's trending items for dashboard display."""
    today = datetime.now(timezone.utc).date()
    snaps = (
        db.query(TrendingSnapshot)
        .filter(TrendingSnapshot.snapshot_date == today)
        .order_by(TrendingSnapshot.engagement_score.desc(), TrendingSnapshot.posted_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "topic": s.topic,
            "title": s.title,
            "platform": s.platform,
            "source_url": s.source_url,
            "author": s.author or "",
            "sentiment": s.sentiment or "neutral",
            "engagement_score": s.engagement_score,
            "posted_at": s.posted_at.isoformat() if s.posted_at else "",
            "snapshot_date": s.snapshot_date.isoformat(),
        }
        for s in snaps
    ]


def get_discovered_topics(db: Session, limit: int = 8) -> list[str]:
    """Unique topic labels from today's snapshots for debate/search widgets."""
    today = datetime.now(timezone.utc).date()
    snaps = (
        db.query(TrendingSnapshot.topic)
        .filter(TrendingSnapshot.snapshot_date == today)
        .order_by(TrendingSnapshot.engagement_score.desc())
        .limit(limit * 2)
        .all()
    )
    seen: set[str] = set()
    topics: list[str] = []
    for (topic,) in snaps:
        t = (topic or "").strip()
        if not t or t in seen:
            continue
        seen.add(t)
        topics.append(t)
        if len(topics) >= limit:
            break
    return topics


def get_yesterday_comparison(db: Session) -> dict[str, int]:
    """Count snapshots today vs yesterday."""
    today = datetime.now(timezone.utc).date()
    from datetime import timedelta

    yesterday = today - timedelta(days=1)
    today_count = (
        db.query(TrendingSnapshot)
        .filter(TrendingSnapshot.snapshot_date == today)
        .count()
    )
    yesterday_count = (
        db.query(TrendingSnapshot)
        .filter(TrendingSnapshot.snapshot_date == yesterday)
        .count()
    )
    return {
        "today": today_count,
        "yesterday": yesterday_count,
        "delta": today_count - yesterday_count,
    }
