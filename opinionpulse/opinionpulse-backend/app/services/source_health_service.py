"""Probe upstream data sources and expose live health for /api/health/sources."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Callable

from app.core.config import get_settings
from app.services.cache_utils import cache_get, cache_set
from app.services.platform_rate_limit import is_rate_limited, remaining_seconds
from app.services.search_service import apis_configured

logger = logging.getLogger(__name__)

CACHE_KEY = "source_health_probe"
CACHE_TTL = 90
PROBE_QUERY = "technology"
PROBE_TIMEOUT = 6.0


def _status_from_probe(
    name: str,
    *,
    configured: bool,
    results: list | None,
    err: str | None,
    ms: int,
) -> dict[str, Any]:
    if not configured:
        return {
            "status": "missing_key",
            "live": False,
            "count": 0,
            "message": "API key not configured",
            "latency_ms": ms,
        }
    if is_rate_limited(name):
        remaining = int(remaining_seconds(name))
        return {
            "status": "rate_limited",
            "live": False,
            "count": 0,
            "message": f"Rate-limited — retry in ~{remaining}s",
            "latency_ms": ms,
            "retry_in_seconds": remaining,
        }
    if err:
        lowered = err.lower()
        if "timeout" in lowered:
            status = "timeout"
        elif "rate" in lowered or "429" in lowered or "403" in lowered:
            status = "rate_limited"
        else:
            status = "error"
        return {
            "status": status,
            "live": False,
            "count": 0,
            "message": err[:200],
            "latency_ms": ms,
        }
    count = len(results or [])
    if count > 0:
        return {
            "status": "ok",
            "live": True,
            "count": count,
            "latency_ms": ms,
        }
    return {
        "status": "empty",
        "live": False,
        "count": 0,
        "message": "No results returned",
        "latency_ms": ms,
    }


def _probe_fetchers() -> dict[str, Callable[[str, str], list[dict]]]:
    from app.services.platforms import (
        search_bluesky,
        search_currents,
        search_devto,
        search_gnews,
        search_guardian,
        search_hackernews,
        search_mediastack,
        search_news,
        search_reddit,
        search_youtube,
        search_mastodon,
        search_github,
        search_stackoverflow,
    )

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
    }


async def _probe_one(name: str, fn: Callable[[str, str], list[dict]]) -> dict[str, Any]:
    configured_map = apis_configured()
    configured = configured_map.get(name, False)
    if not configured:
        return _status_from_probe(name, configured=False, results=None, err=None, ms=0)

    if name in ("reddit", "gnews") and is_rate_limited(name):
        remaining = int(remaining_seconds(name))
        return {
            "status": "rate_limited",
            "live": False,
            "count": 0,
            "message": f"Rate-limited — retry in ~{remaining}s",
            "latency_ms": 0,
            "retry_in_seconds": remaining,
        }

    start = time.perf_counter()

    def _call() -> tuple[list[dict], str | None]:
        try:
            rows = fn(PROBE_QUERY, "24h")
            return rows or [], None
        except Exception as exc:
            return [], str(exc)

    try:
        results, err = await asyncio.wait_for(
            asyncio.to_thread(_call),
            timeout=PROBE_TIMEOUT,
        )
    except asyncio.TimeoutError:
        ms = int((time.perf_counter() - start) * 1000)
        return _status_from_probe(
            name,
            configured=True,
            results=None,
            err="Probe timed out",
            ms=ms,
        )

    ms = int((time.perf_counter() - start) * 1000)
    return _status_from_probe(name, configured=True, results=results, err=err, ms=ms)


async def probe_all_sources() -> dict[str, Any]:
    fetchers = _probe_fetchers()
    names = list(fetchers.keys())
    settled = await asyncio.gather(
        *[_probe_one(name, fetchers[name]) for name in names],
        return_exceptions=True,
    )

    sources: dict[str, dict[str, Any]] = {}
    for name, result in zip(names, settled):
        if isinstance(result, Exception):
            sources[name] = {
                "status": "error",
                "live": False,
                "count": 0,
                "message": str(result)[:200],
                "latency_ms": 0,
            }
        else:
            sources[name] = result

    configured = apis_configured()
    live_count = sum(1 for s in sources.values() if s.get("live"))
    reachable_count = sum(
        1 for s in sources.values() if s.get("status") in ("ok", "empty")
    )
    return {
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "query": PROBE_QUERY,
        "configured": configured,
        "sources": sources,
        "summary": {
            "live": live_count,
            "total_configured": sum(1 for v in configured.values() if v),
            "total_probed": len(sources),
            "any_live": live_count > 0,
            "rate_limited": [
                name
                for name, s in sources.items()
                if s.get("status") == "rate_limited"
            ],
        },
    }


def get_source_health(force_refresh: bool = False) -> dict[str, Any]:
    if not force_refresh:
        hit = cache_get(CACHE_KEY)
        if hit is not None:
            return hit

    payload = asyncio.run(probe_all_sources())
    cache_set(CACHE_KEY, payload, CACHE_TTL)
    return payload


def get_source_health_summary() -> dict[str, Any]:
    """Lightweight summary for /api/health without running probes on every ping."""
    hit = cache_get(CACHE_KEY)
    if hit is not None:
        return hit["summary"]

    configured = apis_configured()
    free_always = ("reddit", "devto", "hackernews", "github", "stackoverflow", "bluesky")
    live_estimate = sum(
        1
        for name in configured
        if configured[name] and not is_rate_limited(name) and name in free_always
    )
    return {
        "live": live_estimate,
        "total_configured": sum(1 for v in configured.values() if v),
        "total_probed": 0,
        "any_live": live_estimate > 0,
        "rate_limited": [
            name for name in free_always if is_rate_limited(name)
        ],
        "stale": True,
    }


def platforms_live_from_probe() -> dict[str, bool]:
    """Map probe/cache results to the dashboard is_live shape."""
    configured = apis_configured()
    hit = cache_get(CACHE_KEY)
    live: dict[str, bool] = {}

    if hit is not None:
        for name, cfg in configured.items():
            if not cfg:
                live[name] = False
                continue
            probe = (hit.get("sources") or {}).get(name, {})
            live[name] = bool(probe.get("live"))
        return live

    for name, cfg in configured.items():
        if not cfg:
            live[name] = False
        elif is_rate_limited(name):
            live[name] = False
        else:
            # Free sources are assumed reachable until a probe proves otherwise.
            live[name] = name in (
                "reddit",
                "devto",
                "hackernews",
                "github",
                "stackoverflow",
                "wikipedia",
            )
    return live
