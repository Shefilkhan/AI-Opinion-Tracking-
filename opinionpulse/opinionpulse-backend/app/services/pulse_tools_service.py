"""Pulse AI tool executors — OpinionPulse data access for agentic retrieval."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.services.cache_utils import get_cached, set_cached
from app.services.platforms.wikipedia import get_wikipedia_summary
from app.services.search_analytics_service import build_search_intelligence
from app.services.search_service import search_all_platforms

logger = logging.getLogger(__name__)


async def search_opinionpulse(
    query: str,
    *,
    time_range: str = "7d",
) -> dict[str, Any]:
    cache_key = f"pulse_tool_search_{query.lower().replace(' ', '_')}_{time_range}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    results: list[dict[str, Any]] = []
    wiki = None
    try:
        results = await search_all_platforms(query, time_range)
        try:
            wiki = await asyncio.to_thread(get_wikipedia_summary, query)
        except Exception as exc:
            logger.debug("Wikipedia skip: %s", exc)
    except Exception as exc:
        logger.error("search_opinionpulse failed: %s", exc)
        return {"query": query, "results": [], "error": str(exc)}

    platforms = sorted({str(r.get("platform", "")) for r in results if r.get("platform")})
    from app.services.chat_service import _sentiment_summary

    sentiment = _sentiment_summary(results)
    payload = {
        "query": query,
        "results": results,
        "sentiment": sentiment,
        "platforms_searched": platforms,
        "wiki": wiki,
        "results_count": len(results),
    }
    set_cached(cache_key, payload, duration=300)
    return payload


async def get_topic_intelligence(
    query: str,
    *,
    time_range: str = "7d",
    search_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload = search_payload or await search_opinionpulse(query, time_range=time_range)
    results = payload.get("results") or []
    if not results:
        return {"query": query, "intelligence": None, "error": payload.get("error")}

    youtube_summary = None
    try:
        from app.services.youtube_analytics_service import build_youtube_summary

        yt_rows = [r for r in results if str(r.get("platform", "")).lower() == "youtube"]
        if yt_rows:
            youtube_summary = build_youtube_summary(yt_rows)
    except Exception as exc:
        logger.debug("YouTube summary skip: %s", exc)

    intelligence = build_search_intelligence(
        query=query,
        results=results,
        displayed_count=len(results),
        sentiment_summary=payload.get("sentiment") or {},
        platforms_searched=payload.get("platforms_searched") or [],
        youtube_summary=youtube_summary,
    )
    return {"query": query, "intelligence": intelligence, "results_count": len(results)}


def _normalize_platform_stats(platform_stats: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Disambiguate volume vs rate labels before sending to the LLM."""
    if not platform_stats:
        return []

    enriched = []
    for p in platform_stats:
        total = max(p.get("content_count") or p.get("total") or 0, 1)
        pos = p.get("positive") or 0
        neg = p.get("negative") or 0
        neu = p.get("neutral") or 0
        enriched.append(
            {
                **p,
                "positive_volume": pos,
                "negative_volume": neg,
                "neutral_volume": neu,
                "positive_rate_pct": round(pos / total * 100) if total else 0,
                "negative_rate_pct": round(neg / total * 100) if total else 0,
            }
        )

    by_pos_rate = sorted(enriched, key=lambda x: x["positive_rate_pct"], reverse=True)
    by_neg_rate = sorted(enriched, key=lambda x: x["negative_rate_pct"], reverse=True)
    by_pos_vol = sorted(enriched, key=lambda x: x["positive_volume"], reverse=True)
    by_neg_vol = sorted(enriched, key=lambda x: x["negative_volume"], reverse=True)

    labels = {p.get("name", ""): dict(p) for p in enriched}
    if by_pos_rate:
        name = by_pos_rate[0].get("name", "")
        if name in labels:
            labels[name]["highest_positive_rate"] = True
    if by_neg_rate:
        name = by_neg_rate[0].get("name", "")
        if name in labels:
            labels[name]["highest_negative_rate"] = True
    if by_pos_vol:
        name = by_pos_vol[0].get("name", "")
        if name in labels:
            labels[name]["largest_positive_volume"] = True
    if by_neg_vol:
        name = by_neg_vol[0].get("name", "")
        if name in labels:
            labels[name]["largest_negative_volume"] = True

    return list(labels.values())


async def compare_topics(
    query_a: str,
    query_b: str,
    *,
    time_range: str = "7d",
) -> dict[str, Any]:
    a_payload, b_payload = await asyncio.gather(
        search_opinionpulse(query_a, time_range=time_range),
        search_opinionpulse(query_b, time_range=time_range),
    )
    return {
        "a": {"query": query_a, "sentiment": a_payload.get("sentiment"), "count": len(a_payload.get("results") or [])},
        "b": {"query": query_b, "sentiment": b_payload.get("sentiment"), "count": len(b_payload.get("results") or [])},
        "results_a": a_payload.get("results") or [],
        "results_b": b_payload.get("results") or [],
    }


async def execute_pulse_tools(
    tool_names: list[str],
    *,
    query: str,
    comparison_queries: list[str] | None = None,
    time_range: str = "7d",
) -> dict[str, Any]:
    """Run router-selected tools and return aggregated payloads."""
    out: dict[str, Any] = {
        "search_payload": None,
        "intelligence": None,
        "comparison": None,
        "web_results": [],
        "x_results": [],
        "errors": [],
    }

    search_payload = None
    if any(t in tool_names for t in ("search_opinionpulse", "compare_topics", "get_topic_intelligence")):
        if "compare_topics" in tool_names and comparison_queries and len(comparison_queries) >= 2:
            out["comparison"] = await compare_topics(
                comparison_queries[0], comparison_queries[1], time_range=time_range
            )
            search_payload = {
                "query": f"{comparison_queries[0]} vs {comparison_queries[1]}",
                "results": (out["comparison"].get("results_a") or [])
                + (out["comparison"].get("results_b") or []),
                "sentiment": {},
                "platforms_searched": [],
                "wiki": None,
            }
            from app.services.chat_service import _sentiment_summary

            search_payload["sentiment"] = _sentiment_summary(search_payload["results"])
            out["search_payload"] = search_payload
        elif "search_opinionpulse" in tool_names or "get_topic_intelligence" in tool_names:
            search_payload = await search_opinionpulse(query, time_range=time_range)
            out["search_payload"] = search_payload

    if "get_topic_intelligence" in tool_names and search_payload:
        intel = await get_topic_intelligence(query, time_range=time_range, search_payload=search_payload)
        intelligence = intel.get("intelligence")
        if intelligence and intelligence.get("platform_stats"):
            intelligence = dict(intelligence)
            intelligence["platform_stats"] = _normalize_platform_stats(intelligence["platform_stats"])
        out["intelligence"] = intelligence

    if "search_web" in tool_names:
        from app.services.xai_service import search_web

        web = await search_web(query)
        out["web_results"] = web.get("results") or []
        if web.get("error"):
            out["errors"].append(f"web_search: {web['error']}")

    if "search_x" in tool_names:
        from app.services.xai_service import search_x

        xres = await search_x(query)
        out["x_results"] = xres.get("results") or []
        if xres.get("error"):
            out["errors"].append(f"x_search: {xres['error']}")

    return out
