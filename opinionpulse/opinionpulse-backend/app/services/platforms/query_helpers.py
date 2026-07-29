"""Helpers for headline / title-focused keyword search."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from dateutil.parser import parse as parse_date


def time_range_delta(time_range: str) -> timedelta:
    """True window: 24h = 24 hours, not 1 calendar day."""
    mapping = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    return mapping.get(time_range, timedelta(hours=24))


def time_range_days(time_range: str) -> int:
    """Calendar days for APIs that only accept date (not datetime)."""
    return { "24h": 1, "7d": 7, "30d": 30 }.get(time_range, 1)


def time_range_cutoff(time_range: str) -> datetime:
    return datetime.now(timezone.utc) - time_range_delta(time_range)


def iso_date_days_ago(time_range: str) -> str:
    days = time_range_days(time_range)
    return (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")


def iso_datetime_cutoff(time_range: str) -> str:
    return time_range_cutoff(time_range).isoformat().replace("+00:00", "Z")


def iso_datetime_days_ago(time_range: str) -> str:
    return iso_datetime_cutoff(time_range)


def query_terms(query: str) -> list[str]:
    """Significant terms from the user query (skip very short words)."""
    return [term for term in query.lower().split() if len(term) > 2]


def title_matches_query(title: str, query: str) -> bool:
    """True when every significant query term appears in the headline."""
    title_lower = (title or "").lower()
    if not title_lower:
        return False
    terms = query_terms(query)
    if not terms:
        q = query.strip().lower()
        return bool(q) and q in title_lower
    return all(term in title_lower for term in terms)


def quoted_phrase_query(query: str) -> str:
    """Wrap multi-word queries in quotes for tighter API matching."""
    q = query.strip()
    if not q:
        return q
    if " " in q and not (q.startswith('"') and q.endswith('"')):
        return f'"{q}"'
    return q


def filter_relevant_results(
    results: list[dict],
    query: str,
    *,
    fallback_to_all: bool = False,
) -> list[dict]:
    """Keep rows whose title/content genuinely match the search topic."""
    if not results or not query.strip():
        return results
    from app.services.source_quality import matches_search_query

    matched = [row for row in results if matches_search_query(query, row)]
    if matched:
        return matched
    return results if fallback_to_all else []


def filter_headline_results(
    results: list[dict],
    query: str,
    *,
    fallback_to_all: bool = False,
) -> list[dict]:
    """Keep rows whose title/content match the query (strict by default)."""
    return filter_relevant_results(results, query, fallback_to_all=fallback_to_all)


def coerce_posted_at_iso(value: Any) -> str | None:
    """Normalize posted_at to ISO-8601 UTC string; None if missing/invalid."""
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
        except (ValueError, OSError, OverflowError):
            return None
    text = str(value).strip()
    if not text:
        return None
    if text.isdigit():
        try:
            return datetime.fromtimestamp(int(text), tz=timezone.utc).isoformat()
        except (ValueError, OSError, OverflowError):
            return None
    try:
        dt = parse_date(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except (ValueError, TypeError, OverflowError):
        return None


def parse_posted_at(value: str | int | float | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc)
        except (ValueError, OSError, OverflowError):
            return None
    try:
        dt = parse_date(str(value))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError, OverflowError):
        return None


def sort_results_by_posted_at(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Newest first — rows without valid timestamps sort last."""

    def sort_key(row: dict[str, Any]) -> tuple[int, datetime]:
        dt = parse_posted_at(row.get("posted_at"))
        if dt is None:
            return (0, datetime.min.replace(tzinfo=timezone.utc))
        return (1, dt)

    return sorted(results, key=sort_key, reverse=True)


def filter_by_time_range(
    results: list[dict[str, Any]],
    time_range: str,
    *,
    fallback_to_all: bool = False,
) -> list[dict[str, Any]]:
    """Keep rows within the requested window, applied per platform."""
    if not results:
        return results
    cutoff = time_range_cutoff(time_range)

    by_platform: dict[str, list[dict[str, Any]]] = {}
    for row in results:
        platform = (row.get("platform") or "unknown").lower()
        by_platform.setdefault(platform, []).append(row)

    filtered: list[dict[str, Any]] = []
    for plat_results in by_platform.values():
        matched = [
            row
            for row in plat_results
            if (dt := parse_posted_at(row.get("posted_at"))) and dt >= cutoff
        ]
        if matched:
            filtered.extend(matched)
        elif fallback_to_all:
            filtered.extend(plat_results)

    return filtered


def make_search_cache_key(
    platform: str, query: str, time_range: str, extra: str = ""
) -> str:
    suffix = f"_{extra}" if extra else ""
    return f"{platform}_{query}_{time_range}{suffix}"
