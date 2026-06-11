from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Callable

from sqlalchemy.orm import Session
from dateutil.parser import parse

from app.core.config import get_settings
from app.db.database import SessionLocal
from app.db.models import SearchHistory, Mention
from app.services.keywords_utils import extract_keywords_from_results
from app.services.platforms import (
    get_wikipedia_summary,
    search_currents,
    search_devto,
    search_gnews,
    search_guardian,
    search_hackernews,
    search_news,
    search_mediastack,
    search_reddit,
    search_youtube,
    search_mastodon,
    search_github,
    search_stackoverflow,
)
from app.services.platforms.platform_common import deduplicate_results, normalize_result
from app.services.search_constants import SENTIMENT_TREND_24H
from app.services.sentiment_analysis import calculate_sentiment_summary, calculate_sentiment_forecast

logger = logging.getLogger(__name__)

NEWS_SOURCES = ("newsapi", "guardian", "mediastack", "currents", "gnews")
TECH_SOURCES = ("devto", "hackernews", "github", "stackoverflow")


def apis_configured() -> dict[str, bool]:
    s = get_settings()
    return {
        "reddit": True,
        "newsapi": bool(s.news_api_key.strip()),
        "youtube": bool(s.youtube_api_key.strip()),
        "guardian": bool(s.guardian_api_key.strip()),
        "mediastack": bool(s.mediastack_api_key.strip()),
        "currents": bool(s.currents_api_key.strip()),
        "gnews": bool(s.gnews_api_key.strip()),
        "devto": True,
        "hackernews": True,
        "wikipedia": True,
        "mastodon": True,
        "github": True,
        "stackoverflow": True,
    }


def platforms_live_status() -> dict[str, bool]:
    return apis_configured()


def _source_enabled(name: str, configured: dict[str, bool]) -> bool:
    if name in ("reddit", "devto", "hackernews", "wikipedia", "mastodon", "github", "stackoverflow"):
        return True
    return configured.get(name, False)


def _resolve_sources(platform_filter: str, configured: dict[str, bool]) -> list[str]:
    pf = (platform_filter or "all").lower()
    if pf == "reddit":
        return ["reddit"]
    if pf == "youtube":
        return ["youtube"]
    if pf == "news":
        return [s for s in NEWS_SOURCES if _source_enabled(s, configured)]
    if pf == "tech":
        return list(TECH_SOURCES)
    if pf == "all":
        sources = ["reddit", "youtube", "mastodon", *TECH_SOURCES]
        sources.extend(s for s in NEWS_SOURCES if _source_enabled(s, configured))
        return sources
    return []


def _fetcher_for(name: str) -> Callable[..., list[dict]] | None:
    return {
        "reddit": search_reddit,
        "newsapi": search_news,
        "youtube": search_youtube,
        "guardian": search_guardian,
        "mediastack": search_mediastack,
        "currents": search_currents,
        "gnews": search_gnews,
        "devto": search_devto,
        "hackernews": search_hackernews,
        "mastodon": search_mastodon,
        "github": search_github,
        "stackoverflow": search_stackoverflow,
    }.get(name)


async def _fetch_source(
    name: str, query: str, time_range: str
) -> tuple[str, list[dict[str, Any]], str | None]:
    fn = _fetcher_for(name)
    if not fn:
        return name, [], "unknown source"
    try:
        results = await asyncio.to_thread(fn, query, time_range)
        return name, results, None
    except ValueError as exc:
        return name, [], str(exc)
    except Exception as exc:
        logger.error("❌ %s failed: %s", name, exc)
        return name, [], str(exc)


def _empty_response(
    query: str,
    configured: dict[str, bool],
    wiki_summary: dict | None,
    errors: list[str],
    platform_filter: str,
) -> dict[str, Any]:
    logger.warning("⚠️ No live results for '%s' — returning empty list (no mock data)", query)
    return {
        "query": query,
        "total_results": 0,
        "sentiment_summary": {"positive": 0, "negative": 0, "neutral": 0},
        "platforms_searched": [],
        "platforms_live": configured,
        "apis_configured": configured,
        "demo_mode": False,
        "peak_discussion": None,
        "most_active_platform": None,
        "results": [],
        "trending_keywords": [],
        "related_topics": [],
        "sentiment_trend": SENTIMENT_TREND_24H,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "wiki_summary": wiki_summary,
        "errors": errors or None,
    }


async def run_search(
    query: str,
    platform: str,
    time_range: str,
    sentiment: str,
    sort_by: str,
) -> dict[str, Any]:
    configured = apis_configured()
    sources = _resolve_sources(platform, configured)

    logger.info('🔍 Searching for: "%s" sources=%s', query, sources)

    tasks = [_fetch_source(name, query, time_range) for name in sources]
    settled = await asyncio.gather(*tasks)

    combined: list[dict[str, Any]] = []
    platforms_searched: list[str] = []
    errors: list[str] = []

    for name, results, err in settled:
        if err and "not configured" in err.lower():
            errors.append(f"{name}: API key missing")
        elif err:
            errors.append(f"{name}: {err}")
        if results:
            for row in results:
                normalized = normalize_result(row, query)
                if normalized:
                    combined.append(normalized)
            if results:
                platforms_searched.append(name)

    # Fetch historical data from DB to supplement live data
    try:
        from datetime import timedelta
        with SessionLocal() as db:
            delta = timedelta(days=1)
            if time_range == "7d": delta = timedelta(days=7)
            if time_range == "30d": delta = timedelta(days=30)
            cutoff = datetime.now(timezone.utc) - delta
            
            historical = db.query(Mention).filter(
                Mention.search_query == query,
                Mention.posted_at >= cutoff
            ).all()
            
            for h in historical:
                # Basic mapping from Mention model to result dictionary
                combined.append({
                    "id": h.id,
                    "platform": h.platform,
                    "author": h.author,
                    "content": h.content,
                    "source_url": h.source_url,
                    "sentiment": h.sentiment,
                    "sentiment_score": h.sentiment_score,
                    "posted_at": h.posted_at.isoformat() if h.posted_at else None,
                    "engagement": {"likes": 0, "shares": 0, "views": 0, "comments": 0}
                })
    except Exception as e:
        logger.error("Failed to retrieve historical data: %s", e)

    wiki_summary = await asyncio.to_thread(get_wikipedia_summary, query)

    if not combined:
        return _empty_response(query, configured, wiki_summary, errors, platform)

    combined = deduplicate_results(combined)

    if sentiment != "all":
        filtered = [r for r in combined if r.get("sentiment") == sentiment]
        if filtered:
            combined = filtered

    if sort_by == "mentioned":
        combined.sort(
            key=lambda r: (r.get("engagement") or {}).get("likes", 0), reverse=True
        )
    elif sort_by == "viral":
        combined.sort(
            key=lambda r: (
                (r.get("engagement") or {}).get("likes", 0)
                + (r.get("engagement") or {}).get("shares", 0) * 2
                + (r.get("engagement") or {}).get("views", 0) // 100
            ),
            reverse=True,
        )
    else:
        combined.sort(key=lambda r: r.get("posted_at", ""), reverse=True)

    summary = calculate_sentiment_summary(combined)
    forecast = calculate_sentiment_forecast(combined)
    keywords = extract_keywords_from_results(combined)
    related = [f"#{w.title()}" for w in query.split()[:4] if len(w) > 2]
    related.extend([f"#{k['word'].title()}" for k in keywords[:3]])

    # Archive to Database
    try:
        with SessionLocal() as db:
            # Avoid duplicate URLs per query
            existing_urls = {
                u[0] for u in db.query(Mention.source_url)
                .filter(Mention.search_query == query, Mention.source_url.isnot(None))
                .all()
            }
            new_mentions = []
            for item in combined:
                url = item.get("source_url")
                if url and url not in existing_urls:
                    dt = None
                    try:
                        if item.get("posted_at"):
                            dt = parse(item.get("posted_at"))
                    except Exception:
                        pass
                    new_mentions.append(Mention(
                        search_query=query,
                        platform=item.get("platform", "unknown")[:50],
                        author=(item.get("author") or "Unknown")[:255],
                        content=item.get("content", ""),
                        source_url=url[:512],
                        sentiment=item.get("sentiment"),
                        sentiment_score=item.get("sentiment_score"),
                        posted_at=dt
                    ))
                    existing_urls.add(url)
            if new_mentions:
                db.add_all(new_mentions)
                db.commit()
    except Exception as e:
        logger.error("Failed to archive historical data: %s", e)

    return {
        "query": query,
        "total_results": len(combined),
        "sentiment_summary": summary,
        "platforms_searched": platforms_searched,
        "platforms_live": configured,
        "apis_configured": configured,
        "demo_mode": False,
        "peak_discussion": datetime.now(timezone.utc).strftime("Today at %I:%M %p"),
        "most_active_platform": max(
            platforms_searched,
            key=lambda p: sum(
                1
                for r in combined
                if (p == "reddit" and r.get("platform") == "reddit")
                or (p == "youtube" and r.get("platform") == "youtube")
                or (p in TECH_SOURCES and r.get("platform") in ("devto", "hackernews"))
                or (p in NEWS_SOURCES and r.get("platform") in ("news", "guardian"))
            ),
            default="reddit",
        ),
        "results": combined[:40],
        "trending_keywords": keywords,
        "related_topics": related[:8],
        "sentiment_trend": SENTIMENT_TREND_24H,
        "sentiment_forecast": forecast,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "wiki_summary": wiki_summary,
        "errors": errors if errors else None,
    }


async def search_all_platforms(
    query: str,
    time_range: str = "24h",
    platform: str = "all",
    fetch_timeout: float = 6.0,
) -> list[dict[str, Any]]:
    """Search all enabled platforms for a topic; used by dashboard widgets."""
    configured = apis_configured()
    sources = _resolve_sources(platform, configured)

    async def fetch_one(name: str) -> tuple[str, list[dict[str, Any]], str | None]:
        try:
            return await asyncio.wait_for(
                _fetch_source(name, query, time_range),
                timeout=fetch_timeout,
            )
        except asyncio.TimeoutError:
            logger.warning("⏱️ %s timed out for '%s'", name, query)
            return name, [], "timeout"

    settled = await asyncio.gather(*[fetch_one(n) for n in sources])
    combined: list[dict[str, Any]] = []
    for _name, results, _err in settled:
        if results:
            for row in results:
                normalized = normalize_result(row, query)
                if normalized:
                    combined.append(normalized)
    return deduplicate_results(combined)


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
