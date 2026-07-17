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
    search_bluesky,
)
from app.services.platforms.platform_common import deduplicate_results, normalize_result
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    parse_posted_at,
    sort_results_by_posted_at,
    time_range_cutoff,
)
from app.services.search_constants import SENTIMENT_TREND_24H
from app.services.source_quality import (
    engagement_total,
    filter_by_relevance,
    normalize_url,
    validate_live_results,
)
from app.services.age_classifier import classify_age_groups, get_all_usage_context
from app.services.content_classifier import classify_content_type
from app.services.risk_assessor import assess_risk_level
from app.services.sentiment_analysis import (
    analyze_sentiment_intensity,
    calculate_sentiment_forecast,
    calculate_sentiment_summary,
    calculate_sentiment_trend_from_results,
)

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
        "mastodon": bool(s.mastodon_access_token.strip()),
        "github": True,
        "stackoverflow": True,
        "bluesky": True,
    }


def platforms_live_status() -> dict[str, bool]:
    return apis_configured()


def _source_enabled(name: str, configured: dict[str, bool]) -> bool:
    if name in (
        "reddit",
        "devto",
        "hackernews",
        "wikipedia",
        "mastodon",
        "github",
        "stackoverflow",
        "bluesky",
    ):
        return True
    return configured.get(name, False)


def _resolve_sources(platform_filter: str, configured: dict[str, bool]) -> list[str]:
    pf = (platform_filter or "all").lower()
    if pf == "reddit":
        return ["reddit"]
    if pf == "youtube":
        return ["youtube"]
    if pf == "bluesky":
        return ["bluesky"]
    if pf == "mastodon":
        return ["mastodon"]
    if pf == "github":
        return ["github"]
    if pf == "stackoverflow":
        return ["stackoverflow"]
    if pf == "news":
        return [s for s in NEWS_SOURCES if _source_enabled(s, configured)]
    if pf == "tech":
        return list(TECH_SOURCES)
    if pf == "all":
        sources = ["reddit", "youtube", "mastodon", "bluesky", *TECH_SOURCES]
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
        "bluesky": search_bluesky,
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


def _source_status(name: str, results: list, err: str | None) -> dict[str, Any]:
    if err and "not configured" in err.lower():
        return {"status": "missing_key", "count": 0, "message": err}
    if err:
        if "timeout" in err.lower():
            return {"status": "timeout", "count": 0, "message": err}
        if "rate" in err.lower() or "403" in err:
            return {"status": "rate_limited", "count": 0, "message": err}
        return {"status": "error", "count": 0, "message": err}
    if not results:
        return {"status": "empty", "count": 0}
    return {"status": "ok", "count": len(results)}


def _sort_combined(results: list[dict[str, Any]], sort_by: str) -> list[dict[str, Any]]:
    if sort_by == "mentioned":
        return sorted(
            results,
            key=lambda r: (
                engagement_total(r) if r.get("engagement_available", True) else 0,
                parse_posted_at(r.get("posted_at")) or time_range_cutoff("30d"),
            ),
            reverse=True,
        )
    if sort_by == "viral":
        return sorted(
            results,
            key=lambda r: (
                (r.get("engagement") or {}).get("likes", 0)
                + (r.get("engagement") or {}).get("shares", 0) * 2
                + (r.get("engagement") or {}).get("views", 0) // 100
                if r.get("engagement_available", True)
                else 0,
                parse_posted_at(r.get("posted_at")) or time_range_cutoff("30d"),
            ),
            reverse=True,
        )
    return sort_results_by_posted_at(results)


def _merge_historical(
    combined: list[dict[str, Any]], query: str, time_range: str
) -> list[dict[str, Any]]:
    """Append archived mentions not already present in live results."""
    live_urls = {
        normalize_url(r.get("source_url") or r.get("url") or "") for r in combined
    }
    try:
        with SessionLocal() as db:
            cutoff = time_range_cutoff(time_range)
            historical = (
                db.query(Mention)
                .filter(
                    Mention.search_query == query,
                    Mention.posted_at >= cutoff,
                )
                .order_by(Mention.posted_at.desc())
                .limit(20)
                .all()
            )
            for h in historical:
                url = h.source_url or ""
                if not url or normalize_url(url) in live_urls:
                    continue
                row = normalize_result(
                    {
                        "id": h.id,
                        "platform": h.platform,
                        "author": h.author or "Unknown",
                        "title": (h.content or "")[:120],
                        "content": h.content,
                        "source_url": url,
                        "sentiment": h.sentiment or "neutral",
                        "sentiment_score": h.sentiment_score or 0.0,
                        "posted_at": h.posted_at.isoformat() if h.posted_at else None,
                        "engagement": {
                            "likes": 0,
                            "shares": 0,
                            "views": 0,
                            "comments": 0,
                        },
                        "engagement_available": False,
                    },
                    query,
                )
                if row:
                    combined.append(row)
                    live_urls.add(normalize_url(url))
    except Exception as e:
        logger.error("Failed to retrieve historical data: %s", e)
    return combined


async def run_search(
    query: str,
    platform: str,
    time_range: str,
    sentiment: str,
    sort_by: str,
    source_allowlist: list[str] | None = None,
) -> dict[str, Any]:
    configured = apis_configured()
    sources = _resolve_sources(platform, configured)
    if source_allowlist is not None:
        sources = [s for s in sources if s in source_allowlist]

    logger.info('🔍 Searching for: "%s" sources=%s', query, sources)

    tasks = [_fetch_source(name, query, time_range) for name in sources]
    settled = await asyncio.gather(*tasks)

    combined: list[dict[str, Any]] = []
    platforms_searched: list[str] = []
    errors: list[str] = []
    source_health: dict[str, dict[str, Any]] = {}
    fetched_at = datetime.now(timezone.utc).isoformat()

    for name, results, err in settled:
        source_health[name] = _source_status(name, results, err)
        if err and "not configured" in err.lower():
            errors.append(f"{name}: API key missing")
        elif err:
            errors.append(f"{name}: {err}")
        if results:
            for row in results:
                normalized = normalize_result(row, query)
                if normalized:
                    combined.append(normalized)
            platforms_searched.append(name)

    combined = validate_live_results(combined, query)
    combined = filter_by_relevance(combined, query)
    combined = filter_by_time_range(combined, time_range, fallback_to_all=False)
    combined = deduplicate_results(combined)
    combined = _merge_historical(combined, query, time_range)
    combined = deduplicate_results(combined)

    wiki_summary = await asyncio.to_thread(get_wikipedia_summary, query)

    if not combined:
        empty = _empty_response(query, configured, wiki_summary, errors, platform)
        empty["source_health"] = source_health
        empty["data_freshness"] = {"fetched_at": fetched_at, "relevance_mode": "strict"}
        empty["relevance_mode"] = "strict"
        return empty

    if sentiment != "all":
        filtered = [r for r in combined if r.get("sentiment") == sentiment]
        if filtered:
            combined = filtered

    combined = _sort_combined(combined, sort_by)

    for result in combined:
        result["content_type"] = classify_content_type(result)
        combined_text = f"{result.get('title', '')} {result.get('content', '')}"
        result["sentiment_detail"] = analyze_sentiment_intensity(
            combined_text, result.get("engagement", {})
        )

    summary = calculate_sentiment_summary(combined)
    age_analysis = classify_age_groups(combined)
    intensity_scores = [r.get("sentiment_detail", {}) for r in combined]
    risk_assessment = assess_risk_level(query, summary, age_analysis, intensity_scores)
    usage_context = get_all_usage_context()
    forecast = calculate_sentiment_forecast(combined)
    sentiment_trend = calculate_sentiment_trend_from_results(combined)
    if not sentiment_trend:
        sentiment_trend = SENTIMENT_TREND_24H
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
        "age_analysis": age_analysis,
        "usage_context": usage_context,
        "risk_assessment": risk_assessment,
        "trending_keywords": keywords,
        "related_topics": related[:8],
        "sentiment_trend": sentiment_trend,
        "sentiment_forecast": forecast,
        "last_updated": fetched_at,
        "wiki_summary": wiki_summary,
        "errors": errors if errors else None,
        "source_health": source_health,
        "data_freshness": {
            "fetched_at": fetched_at,
            "sources_used": len(platforms_searched),
            "sources_failed": sum(
                1 for s in source_health.values() if s.get("status") != "ok"
            ),
        },
        "relevance_mode": "strict",
    }


async def search_all_platforms(
    query: str,
    time_range: str = "24h",
    platform: str = "all",
    fetch_timeout: float = 6.0,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    """Search all enabled platforms for a topic; used by dashboard widgets."""
    data = await run_search(
        query=query,
        platform=platform,
        time_range=time_range,
        sentiment="all",
        sort_by="recent",
    )
    results = data.get("results") or []
    if limit is not None:
        return results[:limit]
    return results


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
