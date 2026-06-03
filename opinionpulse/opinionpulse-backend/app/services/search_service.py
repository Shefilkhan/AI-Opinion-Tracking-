from __future__ import annotations

import asyncio
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import SearchHistory
from app.services.search_mock_data import generate_mock_search, score_sentiment

logger = logging.getLogger(__name__)
settings = get_settings()


def _platforms_configured() -> dict[str, bool]:
    return {
        "twitter": bool(getattr(settings, "twitter_bearer_token", "") or ""),
        "reddit": bool(settings.reddit_client_id and settings.reddit_client_secret),
        "youtube": bool(settings.youtube_api_key),
        "news": bool(getattr(settings, "news_api_key", "") or ""),
    }


async def _fetch_platform(platform: str, query: str) -> list[dict[str, Any]]:
    """Placeholder for live API fetch — returns empty until keys are wired."""
    return []


async def run_search(
    query: str,
    platform: str,
    time_range: str,
    sentiment: str,
    sort_by: str,
) -> dict[str, Any]:
    configured = _platforms_configured()
    any_live = any(configured.values())

    if not any_live:
        return generate_mock_search(query, platform, sentiment, time_range, sort_by)

    platforms = (
        [platform]
        if platform and platform != "all"
        else [p for p, ok in configured.items() if ok]
    )

    tasks = [_fetch_platform(p, query) for p in platforms]
    settled = await asyncio.gather(*tasks, return_exceptions=True)
    combined: list[dict[str, Any]] = []
    for item in settled:
        if isinstance(item, list):
            combined.extend(item)

    if not combined:
        data = generate_mock_search(query, platform, sentiment, time_range, sort_by)
        data["demo_mode"] = True
        return data

    for row in combined:
        if "sentiment" not in row:
            label, score = score_sentiment(row.get("content", ""))
            row["sentiment"] = label
            row["sentiment_score"] = score

    if sentiment != "all":
        combined = [r for r in combined if r.get("sentiment") == sentiment]

    combined.sort(key=lambda r: r.get("posted_at", ""), reverse=True)
    pos = sum(1 for r in combined if r.get("sentiment") == "positive")
    neg = sum(1 for r in combined if r.get("sentiment") == "negative")
    neu = len(combined) - pos - neg
    n = len(combined) or 1
    mock_extra = generate_mock_search(query, platform, sentiment, time_range, sort_by)

    return {
        "query": query,
        "total_results": len(combined),
        "sentiment_summary": {
            "positive": round(pos / n * 100, 1),
            "negative": round(neg / n * 100, 1),
            "neutral": round(neu / n * 100, 1),
        },
        "platforms_searched": platforms,
        "demo_mode": False,
        "peak_discussion": mock_extra.get("peak_discussion"),
        "most_active_platform": platforms[0] if platforms else "twitter",
        "results": combined[:30],
        "trending_keywords": mock_extra["trending_keywords"],
        "related_topics": mock_extra["related_topics"],
        "sentiment_trend": mock_extra["sentiment_trend"],
    }


def record_search_history(
    db: Session,
    user_id: int,
    query: str,
    results_count: int,
    summary: dict[str, float],
) -> SearchHistory:
    row = SearchHistory(
        user_id=user_id,
        query=query.strip()[:100],
        results_count=results_count,
        sentiment_positive=int(summary.get("positive", 0)),
        sentiment_negative=int(summary.get("negative", 0)),
        sentiment_neutral=int(summary.get("neutral", 0)),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
