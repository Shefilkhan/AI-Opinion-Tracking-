"""Float-based relevance scoring and ranking for search results."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from dateutil import parser as dateparser


def score_result_relevance(result: dict[str, Any], original_query: str) -> float:
    """
    Score how relevant a result is to the original query.
    Returns 0.0 to 1.0 — filter out results below 0.25.
    """
    score = 0.0
    query_words = set(original_query.lower().split())
    text = (
        (result.get("title") or "") + " " + (result.get("content") or "")
    ).lower()

    words_found = sum(1 for w in query_words if w in text)
    term_score = words_found / max(len(query_words), 1)
    score += term_score * 0.5

    title = (result.get("title") or "").lower()
    if original_query.lower() in title:
        score += 0.3
    elif any(w in title for w in query_words if len(w) > 3):
        score += 0.15

    eng = result.get("engagement") or {}
    total_engagement = (
        eng.get("likes", 0)
        + eng.get("comments", 0) * 2
        + eng.get("reposts", 0) * 1.5
        + eng.get("shares", 0) * 1.5
    )
    if total_engagement > 1000:
        score += 0.15
    elif total_engagement > 100:
        score += 0.08
    elif total_engagement > 10:
        score += 0.04

    created = result.get("posted_at") or result.get("created_at")
    if created:
        try:
            if isinstance(created, str):
                dt = dateparser.parse(created)
            else:
                dt = created
            if dt:
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                age_hours = (
                    datetime.now(timezone.utc) - dt
                ).total_seconds() / 3600
                if age_hours < 6:
                    score += 0.05
                elif age_hours < 24:
                    score += 0.03
        except Exception:
            pass

    return min(score, 1.0)


def filter_and_rank_results(
    results: list[dict[str, Any]], query: str, min_score: float = 0.25
) -> list[dict[str, Any]]:
    """Score, filter, and rank all results by relevance."""
    scored: list[dict[str, Any]] = []
    for row in results:
        row["relevance_score"] = score_result_relevance(row, query)
        if row["relevance_score"] >= min_score:
            scored.append(row)

    return sorted(scored, key=lambda x: x["relevance_score"], reverse=True)
