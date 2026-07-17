"""Unified topics table data — merges trending + most discussed with sparklines."""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Mention
from app.services.dashboard_debates_service import get_live_debates, get_most_discussed
from app.services.dashboard_live_service import get_dashboard_overview

logger = logging.getLogger(__name__)

TIMEFRAME_DAYS = {"24h": 1, "7d": 7, "30d": 30}


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "topic"


def _topic_id(name: str, query: str) -> str:
    raw = f"{name}|{query}".encode()
    return hashlib.md5(raw).hexdigest()[:12]


def get_mention_volume_history(
    db: Session, search_query: str, days: int
) -> list[dict[str, Any]]:
    """Daily mention counts for sparkline; fills missing days with zero."""
    if days < 1:
        days = 7
    cutoff = datetime.now(timezone.utc) - timedelta(days=days - 1)
    cutoff_date = cutoff.date()

    date_col = Mention.fetched_at
    try:
        rows = (
            db.query(
                func.date(date_col).label("day"),
                func.count(Mention.id).label("cnt"),
            )
            .filter(
                Mention.search_query.ilike(f"%{search_query.strip()}%"),
                func.date(date_col) >= cutoff_date,
            )
            .group_by(func.date(date_col))
            .order_by(func.date(date_col))
            .all()
        )
    except Exception as exc:
        logger.debug("Sparkline via fetched_at failed (%s), trying posted_at", exc)
        db.rollback()
        try:
            rows = (
                db.query(
                    func.date(Mention.posted_at).label("day"),
                    func.count(Mention.id).label("cnt"),
                )
                .filter(
                    Mention.search_query.ilike(f"%{search_query.strip()}%"),
                    Mention.posted_at.isnot(None),
                    func.date(Mention.posted_at) >= cutoff_date,
                )
                .group_by(func.date(Mention.posted_at))
                .order_by(func.date(Mention.posted_at))
                .all()
            )
        except Exception as exc2:
            logger.debug("Sparkline via posted_at failed: %s", exc2)
            db.rollback()
            return []

    day_map: dict[str, int] = {}
    for row in rows:
        day_val = row.day
        if hasattr(day_val, "isoformat"):
            key = day_val.isoformat()
        else:
            key = str(day_val)
        day_map[key] = int(row.cnt)

    today = date.today()
    sparkline: list[dict[str, Any]] = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        key = d.isoformat()
        sparkline.append(
            {
                "day": d.strftime("%a"),
                "mentions": day_map.get(key, 0),
            }
        )
    return sparkline


def _synthetic_sparkline(total: int, days: int) -> list[dict[str, Any]]:
    """Fallback when no Mention rows exist yet."""
    today = date.today()
    if total <= 0:
        return [
            {"day": (today - timedelta(days=i)).strftime("%a"), "mentions": 0}
            for i in range(days - 1, -1, -1)
        ]
    base = max(1, total // days)
    sparkline = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        variance = (i % 3) - 1
        sparkline.append(
            {
                "day": d.strftime("%a"),
                "mentions": max(0, base + variance),
            }
        )
    return sparkline


def _direction_from_sparkline(sparkline: list[dict[str, Any]]) -> tuple[str, float]:
    if len(sparkline) < 2:
        return "flat", 0.0
    mid = len(sparkline) // 2
    first = sum(p["mentions"] for p in sparkline[:mid]) or 0
    second = sum(p["mentions"] for p in sparkline[mid:]) or 0
    if first == 0 and second == 0:
        return "flat", 0.0
    if first == 0:
        return "up", 100.0
    change = ((second - first) / first) * 100
    if abs(change) < 3:
        return "flat", round(abs(change), 1)
    return ("up" if change > 0 else "down"), round(abs(change), 1)


def fetch_aggregated_topics(
    db: Session, timeframe: str = "7d"
) -> list[dict[str, Any]]:
    """Merge most-discussed, live debates, and trending feed topics."""
    days = TIMEFRAME_DAYS.get(timeframe, 7)
    merged: dict[str, dict[str, Any]] = {}

    try:
        most = get_most_discussed()
    except Exception as exc:
        logger.error("topics-table most_discussed failed: %s", exc)
        most = []

    for item in most:
        query = (item.get("query") or item.get("topic") or "").strip()
        name = item.get("topic") or query.title()
        key = _slug(query or name)
        sentiment = item.get("sentiment") or {}
        platforms = list((item.get("platform_breakdown") or {}).keys())
        merged[key] = {
            "id": _topic_id(name, query),
            "name": name,
            "search_query": query or name.lower(),
            "mention_count": int(item.get("total_mentions") or 0),
            "sentiment_positive_pct": int(sentiment.get("positive") or 50),
            "sentiment_negative_pct": int(sentiment.get("negative") or 30),
            "direction": item.get("trend", "stable"),
            "is_heated_debate": False,
            "platforms": platforms[:6],
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "engagement_score": int(item.get("total_engagement") or 0),
        }

    try:
        debates = get_live_debates()
    except Exception as exc:
        logger.error("topics-table live_debates failed: %s", exc)
        debates = []

    for debate in debates:
        topic = (debate.get("topic") or "").strip()
        if not topic:
            continue
        key = _slug(topic)
        sentiment = debate.get("sentiment") or {}
        platforms = debate.get("platforms") or []
        if key in merged:
            merged[key]["is_heated_debate"] = bool(debate.get("is_heated"))
            merged[key]["mention_count"] = max(
                merged[key]["mention_count"],
                int(debate.get("total_mentions") or 0),
            )
            for p in platforms:
                if p not in merged[key]["platforms"]:
                    merged[key]["platforms"].append(p)
        else:
            merged[key] = {
                "id": _topic_id(topic, topic),
                "name": topic.title(),
                "search_query": topic.lower(),
                "mention_count": int(debate.get("total_mentions") or 0),
                "sentiment_positive_pct": int(sentiment.get("positive") or 50),
                "sentiment_negative_pct": int(sentiment.get("negative") or 30),
                "direction": "up" if debate.get("is_heated") else "flat",
                "is_heated_debate": bool(debate.get("is_heated")),
                "platforms": platforms[:6],
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "engagement_score": int(debate.get("total_engagement") or 0),
            }

    try:
        overview = get_dashboard_overview(db=db)
        for t in overview.get("trending_topics") or []:
            name = (t.get("name") or "").strip()
            query = (t.get("query") or name).replace("#", "").strip()
            if not name:
                continue
            key = _slug(query or name)
            if key in merged:
                continue
            merged[key] = {
                "id": _topic_id(name, query),
                "name": name,
                "search_query": query or name.lower(),
                "mention_count": _parse_mentions(t.get("mentions", "0")),
                "sentiment_positive_pct": 55 if t.get("sentiment") == "positive" else 45,
                "sentiment_negative_pct": 55 if t.get("sentiment") == "negative" else 35,
                "direction": t.get("trend", "up"),
                "is_heated_debate": False,
                "platforms": ["reddit"],
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "engagement_score": _parse_mentions(t.get("mentions", "0")),
            }
    except Exception as exc:
        logger.error("topics-table trending merge failed: %s", exc)

    result: list[dict[str, Any]] = []
    for entry in merged.values():
        sparkline = get_mention_volume_history(db, entry["search_query"], days)
        if sum(p["mentions"] for p in sparkline) == 0:
            today = date.today()
            sparkline = [
                {"day": (today - timedelta(days=i)).strftime("%a"), "mentions": 0}
                for i in range(days - 1, -1, -1)
            ]

        direction_raw = entry.pop("direction", "flat")
        direction, direction_pct = _direction_from_sparkline(sparkline)
        if direction_raw in ("up", "down", "stable", "flat"):
            if direction_raw == "stable":
                direction_raw = "flat"
            if direction == "flat" and direction_raw in ("up", "down"):
                direction = direction_raw
                direction_pct = max(direction_pct, 5.0)

        engagement = entry.pop("engagement_score", entry["mention_count"])
        result.append(
            {
                **entry,
                "direction": direction,
                "direction_pct": direction_pct,
                "platform_count": len(entry["platforms"]),
                "sparkline_data": sparkline,
                "engagement_score": engagement,
            }
        )

    return result


def _parse_mentions(raw: Any) -> int:
    if isinstance(raw, int):
        return raw
    if not raw:
        return 0
    s = str(raw).replace(",", "")
    match = re.search(r"\d+", s)
    return int(match.group()) if match else 0


def sort_topics(
    topics: list[dict[str, Any]],
    sort_by: str = "engagement",
    sort_order: str = "desc",
) -> list[dict[str, Any]]:
    reverse = sort_order.lower() != "asc"

    def key_engagement(t: dict[str, Any]) -> int:
        return int(t.get("engagement_score") or t.get("mention_count") or 0)

    def key_sentiment(t: dict[str, Any]) -> int:
        return int(t.get("sentiment_positive_pct") or 0)

    def key_mentions(t: dict[str, Any]) -> int:
        return int(t.get("mention_count") or 0)

    def key_recent(t: dict[str, Any]) -> str:
        return t.get("last_updated") or ""

    sort_key_map = {
        "engagement": key_engagement,
        "sentiment": key_sentiment,
        "mentions": key_mentions,
        "recent": key_recent,
    }
    key_fn = sort_key_map.get(sort_by, key_engagement)
    return sorted(topics, key=key_fn, reverse=reverse)


def get_topics_table(
    db: Session,
    sort_by: str = "engagement",
    sort_order: str = "desc",
    timeframe: str = "7d",
) -> dict[str, Any]:
    topics = fetch_aggregated_topics(db, timeframe=timeframe)
    topics = sort_topics(topics, sort_by=sort_by, sort_order=sort_order)
    for t in topics:
        t.pop("engagement_score", None)
        t.pop("search_query", None)
    return {"topics": topics, "timeframe": timeframe}
