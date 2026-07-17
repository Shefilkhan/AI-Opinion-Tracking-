"""Relevance scoring, URL normalization, and result quality filters."""

from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs, urlparse, urlunparse

from app.services.url_validation import is_live_result, is_valid_url

RELEVANCE_THRESHOLD = 2


def query_terms(query: str) -> list[str]:
    return [t for t in query.lower().split() if len(t) > 2]


def relevance_score(query: str, result: dict[str, Any]) -> int:
    """Score how well a result matches the user query (higher = more relevant)."""
    if not query.strip():
        return 0

    q_lower = query.strip().lower()
    title = (result.get("title") or "").lower()
    content = (result.get("content") or "").lower()
    combined = f"{title} {content}"

    score = 0
    terms = query_terms(query)

    if q_lower in title:
        score += 5
    elif q_lower in combined:
        score += 3

    for term in terms:
        if term in title:
            score += 3
        elif term in content:
            score += 1

    if not terms and q_lower in combined:
        score += 2

    return score


def filter_by_relevance(
    results: list[dict[str, Any]],
    query: str,
    *,
    min_score: int = RELEVANCE_THRESHOLD,
) -> list[dict[str, Any]]:
    if not results or not query.strip():
        return results
    scored: list[dict[str, Any]] = []
    for row in results:
        item = dict(row)
        rs = relevance_score(query, item)
        item["relevance_score"] = rs
        if rs >= min_score:
            scored.append(item)
    return scored


def normalize_url(url: str) -> str:
    """Normalize URL for deduplication (strip tracking params, trailing slash)."""
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        if not parsed.scheme.startswith("http"):
            return url.lower().rstrip("/")
        drop_params = {
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "ref",
            "fbclid",
            "gclid",
        }
        qs = parse_qs(parsed.query, keep_blank_values=False)
        clean_qs = {k: v for k, v in qs.items() if k.lower() not in drop_params}
        new_query = "&".join(
            f"{k}={v[0]}" for k, v in sorted(clean_qs.items()) if v
        )
        path = (parsed.path or "").rstrip("/") or "/"
        return urlunparse(
            (parsed.scheme.lower(), (parsed.hostname or "").lower(), path, "", new_query, "")
        )
    except Exception:
        return url.lower().rstrip("/")


def engagement_total(result: dict[str, Any]) -> int:
    eng = result.get("engagement") or {}
    return (
        int(eng.get("likes") or 0)
        + int(eng.get("comments") or 0)
        + int(eng.get("shares") or 0)
        + int(eng.get("views") or 0) // 100
    )


def has_engagement_data(result: dict[str, Any]) -> bool:
    if result.get("engagement_available") is False:
        return False
    eng = result.get("engagement") or {}
    return any(int(eng.get(k) or 0) > 0 for k in ("likes", "comments", "shares", "views"))


def validate_live_results(
    results: list[dict[str, Any]], query: str
) -> list[dict[str, Any]]:
    """Keep rows with valid URLs that look like real posts/articles."""
    validated: list[dict[str, Any]] = []
    for row in results:
        item = dict(row)
        url = item.get("source_url") or item.get("url") or ""
        if not is_valid_url(url):
            continue
        item["source_url"] = url
        item["url"] = url
        item["is_demo"] = not is_live_result(item)
        if item["is_demo"]:
            continue
        validated.append(item)
    return validated
