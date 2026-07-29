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
from app.services.brand_disambiguator import BrandDisambiguator
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
from app.services.platforms.youtube_platform import fetch_youtube_comments
from app.services.search_constants import SENTIMENT_TREND_24H
from app.services.source_quality import (
    engagement_total,
    filter_by_relevance,
    filter_spam_results,
    matches_search_query,
    normalize_url,
    validate_live_results,
)
from app.services.age_classifier import classify_age_groups, get_all_usage_context
from app.services.content_classifier import classify_content_type
from app.services.query_processor import QueryProcessor
from app.services.relevance_scorer import filter_and_rank_results
from app.services.risk_assessor import assess_risk_level
from app.services.sentiment_analysis import (
    analyze_sentiment_intensity,
    calculate_sentiment_forecast,
    calculate_sentiment_summary,
    calculate_sentiment_trend_from_results,
)

logger = logging.getLogger(__name__)

_query_processor = QueryProcessor()
_brand_disambiguator = BrandDisambiguator()
_fetch_semaphore = asyncio.Semaphore(5)

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
    name: str,
    query: str,
    time_range: str,
    *,
    fallback_query: str | None = None,
    raw_query: str | None = None,
) -> tuple[str, list[dict[str, Any]], str | None]:
    fn = _fetcher_for(name)
    if not fn:
        return name, [], "unknown source"

    async def _call(q: str, tr: str) -> list[dict[str, Any]]:
        async with _fetch_semaphore:
            return await asyncio.to_thread(fn, q, tr)

    try:
        results = await _call(query, time_range)

        if not results and fallback_query and fallback_query != query:
            results = await _call(fallback_query, time_range)

        if not results and raw_query and raw_query not in (query, fallback_query):
            results = await _call(raw_query, time_range)

        if (
            not results
            and name in NEWS_SOURCES
            and time_range == "24h"
        ):
            results = await _call(query, "7d")
            if not results and fallback_query:
                results = await _call(fallback_query, "7d")

        return name, results, None
    except ValueError as exc:
        return name, [], str(exc)
    except Exception as exc:
        logger.error("❌ %s failed: %s", name, exc)
        return name, [], str(exc)


def _ensure_diverse_results(
    results: list[dict[str, Any]],
    *,
    min_per_platform: int = 2,
    per_platform: int = 4,
) -> list[dict[str, Any]]:
    """Cap per-platform representation while preserving minimum diversity."""
    if not results:
        return results

    by_platform: dict[str, list[dict[str, Any]]] = {}
    for row in results:
        platform = (row.get("platform") or "unknown").lower()
        by_platform.setdefault(platform, []).append(row)

    selected: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for platform, items in by_platform.items():
        take = max(min_per_platform, min(per_platform, len(items)))
        for item in items[:take]:
            item_id = item.get("id") or normalize_url(item.get("source_url") or "")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            selected.append(item)

    if len(selected) < len(results):
        for row in results:
            item_id = row.get("id") or normalize_url(row.get("source_url") or "")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            selected.append(row)

    return selected


def _empty_response(
    query: str,
    configured: dict[str, bool],
    wiki_summary: dict | None,
    errors: list[str],
    platform_filter: str,
    search_metadata: dict[str, int] | None = None,
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
        "search_metadata": search_metadata or {
            "spam_filtered": 0,
            "non_english_filtered": 0,
            "brand_noise_filtered": 0,
            "youtube_comments_included": 0,
        },
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
                r.get("relevance_score", 0),
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
                r.get("relevance_score", 0),
                parse_posted_at(r.get("posted_at")) or time_range_cutoff("30d"),
            ),
            reverse=True,
        )
    return sorted(
        results,
        key=lambda r: (
            r.get("relevance_score", 0),
            parse_posted_at(r.get("posted_at")) or time_range_cutoff("30d"),
        ),
        reverse=True,
    )


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
                if row and matches_search_query(query, row):
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
    language: str = "all",
) -> dict[str, Any]:
    configured = apis_configured()
    sources = _resolve_sources(platform, configured)
    if source_allowlist is not None:
        sources = [s for s in sources if s in source_allowlist]

    processed = _query_processor.process(query)
    search_query = processed["cleaned"]
    platform_queries = processed["platform_queries"]
    raw_query = query.strip()

    brand_config = _brand_disambiguator.get_brand_config(search_query)
    brand_precise = (
        _brand_disambiguator.build_precise_query(search_query)
        if brand_config
        else None
    )

    logger.info(
        '🔍 Searching for: "%s" (cleaned="%s", intent=%s, brand=%s) sources=%s',
        query,
        search_query,
        processed["intent"],
        bool(brand_config),
        sources,
    )

    tasks = [
        _fetch_source(
            name,
            platform_queries.get(name, search_query),
            time_range,
            fallback_query=brand_precise if name in NEWS_SOURCES else None,
            raw_query=raw_query,
        )
        for name in sources
    ]
    settled = await asyncio.gather(*tasks)

    combined: list[dict[str, Any]] = []
    platforms_searched: list[str] = []
    errors: list[str] = []
    source_health: dict[str, dict[str, Any]] = {}
    fetched_at = datetime.now(timezone.utc).isoformat()
    search_metadata = {
        "spam_filtered": 0,
        "non_english_filtered": 0,
        "brand_noise_filtered": 0,
        "youtube_comments_included": 0,
    }

    for name, results, err in settled:
        source_health[name] = _source_status(name, results, err)
        if err and "not configured" in err.lower():
            errors.append(f"{name}: API key missing")
        elif err:
            errors.append(f"{name}: {err}")
        if results:
            for row in results:
                normalized = normalize_result(row, search_query)
                if normalized:
                    combined.append(normalized)
            platforms_searched.append(name)


    if "youtube" in platforms_searched and configured.get("youtube"):
        video_ids = [
            (r.get("metadata") or {}).get("video_id")
            or (r.get("source_url") or "").split("v=")[-1].split("&")[0]
            for r in combined
            if r.get("platform") == "youtube" and not r.get("is_comment")
        ]
        video_ids = [vid for vid in video_ids if vid and len(vid) >= 8][:5]
        if video_ids:
            try:
                comments = await asyncio.to_thread(
                    fetch_youtube_comments, video_ids, search_query
                )
                for comment in comments:
                    normalized = normalize_result(comment, search_query)
                    if normalized:
                        combined.append(normalized)
                search_metadata["youtube_comments_included"] = len(comments)
            except Exception as exc:
                logger.warning("YouTube comments fetch failed: %s", exc)

    combined = validate_live_results(combined, search_query)

    before_spam = len(combined)
    combined = filter_spam_results(combined)
    search_metadata["spam_filtered"] = before_spam - len(combined)

    if language == "english":
        english_results = []
        for row in combined:
            text = f"{row.get('title') or ''} {row.get('content') or ''}"
            if _brand_disambiguator.is_english(text):
                english_results.append(row)
        search_metadata["non_english_filtered"] = len(combined) - len(english_results)
        combined = english_results

    if brand_config:
        brand_filtered = []
        for row in combined:
            if _brand_disambiguator.should_exclude_result(row, search_query):
                search_metadata["brand_noise_filtered"] += 1
                continue
            if _brand_disambiguator.is_spam(row, search_query):
                search_metadata["spam_filtered"] += 1
                continue
            brand_filtered.append(row)
        combined = brand_filtered

    combined = filter_by_relevance(combined, search_query)
    combined = filter_by_time_range(combined, time_range, fallback_to_all=True)
    combined = deduplicate_results(combined)
    combined = _merge_historical(combined, search_query, time_range)
    combined = deduplicate_results(combined)

    min_rank_score = 0.15 if len(combined) < 8 else 0.25
    combined = filter_and_rank_results(combined, search_query, min_score=min_rank_score)
    combined = _ensure_diverse_results(combined, min_per_platform=2, per_platform=4)

    wiki_summary = await asyncio.to_thread(get_wikipedia_summary, search_query)

    if not combined:
        empty = _empty_response(
            query, configured, wiki_summary, errors, platform, search_metadata
        )
        empty["source_health"] = source_health
        empty["data_freshness"] = {"fetched_at": fetched_at, "relevance_mode": "strict"}
        empty["relevance_mode"] = "strict"
        empty["query_meta"] = {
            "original": processed["original"],
            "cleaned": processed["cleaned"],
            "intent": processed["intent"],
            "expansions": processed["expansions"],
        }
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
    risk_assessment = assess_risk_level(search_query, summary, age_analysis, intensity_scores)
    usage_context = get_all_usage_context()
    forecast = calculate_sentiment_forecast(combined)
    sentiment_trend = calculate_sentiment_trend_from_results(combined)
    if not sentiment_trend:
        sentiment_trend = SENTIMENT_TREND_24H
    keywords = extract_keywords_from_results(combined)
    _junk_topics = {"https", "http", "www", "com", "link", "live", "signal", "chart"}
    related = [f"#{w.title()}" for w in search_query.split()[:4] if len(w) > 2]
    related.extend(
        f"#{k['word'].title()}"
        for k in keywords[:5]
        if k["word"].lower() not in _junk_topics
    )

    try:
        with SessionLocal() as db:
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
            {r.get("platform") for r in combined if r.get("platform")},
            key=lambda p: sum(1 for r in combined if r.get("platform") == p),
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
        "search_metadata": search_metadata,
        "data_freshness": {
            "fetched_at": fetched_at,
            "sources_used": len(platforms_searched),
            "sources_failed": sum(
                1 for s in source_health.values() if s.get("status") != "ok"
            ),
        },
        "relevance_mode": "strict",
        "query_meta": {
            "original": processed["original"],
            "cleaned": processed["cleaned"],
            "intent": processed["intent"],
            "expansions": processed["expansions"],
        },
    }


async def search_all_platforms(
    query: str,
    time_range: str = "24h",
    platform: str = "all",
    fetch_timeout: float = 6.0,
    limit: int | None = None,
    source_allowlist: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Search enabled platforms for a topic; used by dashboard widgets."""
    try:
        data = await asyncio.wait_for(
            run_search(
                query=query,
                platform=platform,
                time_range=time_range,
                sentiment="all",
                sort_by="recent",
                source_allowlist=source_allowlist,
            ),
            timeout=fetch_timeout,
        )
    except asyncio.TimeoutError:
        logger.warning('Dashboard search timed out for "%s" after %.0fs', query, fetch_timeout)
        return []
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
