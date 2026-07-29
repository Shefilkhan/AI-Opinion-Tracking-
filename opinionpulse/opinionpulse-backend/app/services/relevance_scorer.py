"""Float-based relevance scoring and ranking for search results."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from dateutil import parser as dateparser

from app.services.source_quality import _term_in_text


def _query_in_text(query: str, text: str) -> bool:
    """True when all significant query terms appear in text."""
    q = query.strip()
    if not q or not text:
        return False
    q_lower = q.lower()
    text_lower = text.lower()
    if q_lower in text_lower:
        return True
    words = [w for w in q_lower.split() if len(w) > 2]
    if not words:
        return q_lower in text_lower
    return all(_term_in_text(w, text_lower) for w in words)


def score_result_relevance(result: dict[str, Any], original_query: str) -> float:
    """
    Score how relevant a result is to the original query.
    Returns 0.0 to 1.0 — filter out results below 0.25.
    """
    score = 0.0
    query_words = [w for w in original_query.lower().split() if len(w) > 2]
    text = (
        (result.get("title") or "") + " " + (result.get("content") or "")
    ).lower()

    if query_words:
        words_found = sum(1 for w in query_words if _term_in_text(w, text))
        term_score = words_found / len(query_words)
    else:
        term_score = 1.0 if _query_in_text(original_query, text) else 0.0
    score += term_score * 0.5

    title = (result.get("title") or "").lower()
    if _query_in_text(original_query, title):
        score += 0.3
    elif any(_term_in_text(w, title) for w in query_words if len(w) > 3):
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
