"""Helpers for headline / title-focused keyword search."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from dateutil.parser import parse as parse_date


def time_range_days(time_range: str) -> int:
    return {"24h": 1, "7d": 7, "30d": 30}.get(time_range, 1)


def iso_date_days_ago(time_range: str) -> str:
    days = time_range_days(time_range)
    return (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")


def iso_datetime_days_ago(time_range: str) -> str:
    days = time_range_days(time_range)
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat().replace("+00:00", "Z")


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


def filter_headline_results(
    results: list[dict],
    query: str,
    *,
    fallback_to_all: bool = False,
) -> list[dict]:
    """Keep rows whose title contains the query terms."""
    if not results or not query.strip():
        return results
    matched = [row for row in results if title_matches_query(row.get("title") or "", query)]
    if matched:
        return matched
    return results if fallback_to_all else []


def parse_posted_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = parse_date(str(value))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError, OverflowError):
        return None


def sort_results_by_posted_at(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Newest first — used after merging API responses."""
    return sorted(
        results,
        key=lambda row: parse_posted_at(row.get("posted_at")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )


def filter_by_time_range(
    results: list[dict[str, Any]],
    time_range: str,
    *,
    fallback_to_all: bool = True,
) -> list[dict[str, Any]]:
    """Keep rows within the requested window; APIs often miss same-day items."""
    if not results:
        return results
    days = time_range_days(time_range)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    matched = [
        row
        for row in results
        if (dt := parse_posted_at(row.get("posted_at"))) and dt >= cutoff
    ]
    if matched:
        return matched
    return results if fallback_to_all else []
