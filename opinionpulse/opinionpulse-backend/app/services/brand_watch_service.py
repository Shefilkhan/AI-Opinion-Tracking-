"""Brand & reputation watchlists — bundled terms, baseline vs spike, merged search."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from app.db.models import SavedSearch
from app.services.query_processor import QueryProcessor
from app.services.sentiment_analysis import calculate_sentiment_summary

_query_processor = QueryProcessor()


def parse_watch_meta(row: SavedSearch) -> dict[str, Any]:
    meta: dict[str, Any] = {"threshold": 70, "frequency": "daily", "watch_type": "single"}
    if row.filters_json:
        try:
            parsed = json.loads(row.filters_json)
            if isinstance(parsed, dict):
                meta.update(parsed)
        except Exception:
            pass
    return meta


def build_search_terms(meta: dict[str, Any], primary_query: str) -> list[str]:
    """Collect brand + product + CEO + aliases into deduped search terms."""
    terms: list[str] = []
    seen: set[str] = set()

    def add(term: str | None) -> None:
        cleaned = (term or "").strip()
        if not cleaned:
            return
        key = cleaned.lower()
        if key in seen:
            return
        seen.add(key)
        terms.append(cleaned)

    add(meta.get("brand") or primary_query)
    add(meta.get("product"))
    add(meta.get("ceo"))
    for alias in meta.get("aliases") or []:
        add(str(alias))
    for term in meta.get("terms") or []:
        add(str(term))
    if not terms:
        add(primary_query)
    return terms[:8]


def watch_display_name(row: SavedSearch, meta: dict[str, Any] | None = None) -> str:
    meta = meta or parse_watch_meta(row)
    return str(meta.get("name") or meta.get("brand") or row.query)


def spike_summary(
    *,
    current_negative: int,
    baseline_negative: float,
    current_mentions: int,
    baseline_mentions: float,
) -> dict[str, Any]:
    """Human-readable baseline vs spike for UI and reports."""
    base_neg = max(baseline_negative, 0.5)
    base_men = max(baseline_mentions, 1.0)
    neg_mult = round(current_negative / base_neg, 1) if current_negative else 0.0
    vol_mult = round(current_mentions / base_men, 1) if current_mentions else 0.0

    label = "Within normal range"
    severity = "normal"
    if neg_mult >= 3:
        label = f"Today is {neg_mult}× normal negative mentions"
        severity = "critical"
    elif neg_mult >= 2:
        label = f"Today is {neg_mult}× normal negative mentions"
        severity = "elevated"
    elif neg_mult >= 1.5:
        label = f"Negative mentions are {neg_mult}× your baseline"
        severity = "watch"

    return {
        "baseline_negative_30m": round(baseline_negative, 2),
        "baseline_mentions_30m": round(baseline_mentions, 2),
        "negative_spike_multiplier": neg_mult,
        "volume_spike_multiplier": vol_mult,
        "spike_label": label,
        "spike_severity": severity,
    }


async def fetch_bundle_results(terms: list[str], time_range: str = "24h") -> list[dict[str, Any]]:
    """Search all bundle terms and merge by URL."""
    from app.services.search_service import run_search

    merged: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for term in terms:
        try:
            payload = await run_search(
                query=term,
                platform="all",
                time_range=time_range,
                sentiment="all",
                sort_by="recent",
            )
        except Exception:
            continue
        for row in payload.get("results") or []:
            url = (row.get("source_url") or row.get("url") or "").strip()
            if url and url in seen_urls:
                continue
            if url:
                seen_urls.add(url)
            merged.append(row)
    return merged


async def preview_watch_query(search_query: str, *, label: str | None = None, opt_type: str = "brand") -> dict[str, Any]:
    """Lightweight live preview for brand-monitor setup."""
    from app.services.search_service import run_search

    q = search_query.strip()
    display = (label or q).strip()
    empty: dict[str, Any] = {
        "id": q.lower(),
        "label": display,
        "query": q,
        "type": opt_type,
        "total_mentions": 0,
        "platforms": [],
        "has_live_data": False,
        "sample_title": None,
        "sentiment_positive": 0,
        "sentiment_negative": 0,
    }
    if len(q) < 2:
        return empty

    try:
        payload = await asyncio.wait_for(
            run_search(
                query=q,
                platform="all",
                time_range="7d",
                sentiment="all",
                sort_by="recent",
            ),
            timeout=20.0,
        )
    except asyncio.TimeoutError:
        return empty

    results = payload.get("results") or []
    platforms = sorted({str(r.get("platform")) for r in results if r.get("platform")})
    sentiment = calculate_sentiment_summary(results) if results else {"positive": 0, "negative": 0}

    return {
        "id": q.lower(),
        "label": display,
        "query": q,
        "type": opt_type,
        "total_mentions": len(results),
        "platforms": platforms[:8],
        "has_live_data": len(results) > 0,
        "sample_title": ((results[0].get("title") or "")[:120] if results else None),
        "sentiment_positive": int(sentiment.get("positive", 0)),
        "sentiment_negative": int(sentiment.get("negative", 0)),
    }


def _related_watch_labels(query: str, results: list[dict[str, Any]]) -> list[tuple[str, str]]:
    """Headline-based alternate labels that still search the same keyword."""
    q = query.lower().strip()
    seen: set[str] = set()
    labels: list[tuple[str, str]] = []

    for row in results[:20]:
        title = (row.get("title") or row.get("content") or "").strip()
        if not title or q not in title.lower():
            continue
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        short = title if len(title) <= 72 else f"{title[:69].rstrip()}…"
        labels.append((short, query))
        if len(labels) >= 3:
            break
    return labels


async def suggest_watch_options(raw_query: str) -> dict[str, Any]:
    """Return selectable monitor options backed by a live source search."""
    query = raw_query.strip()
    if len(query) < 2:
        return {"query": query, "options": []}

    processed = _query_processor.process(query)
    cleaned = (processed.get("cleaned") or query).strip()
    primary_label = cleaned.title() if cleaned.islower() else cleaned

    candidate_queries: list[tuple[str, str, str]] = []
    seen_ids: set[str] = set()

    def add_candidate(label: str, search_q: str, opt_type: str = "brand") -> None:
        sq = search_q.strip()
        if len(sq) < 2:
            return
        cid = sq.lower()
        if cid in seen_ids:
            return
        seen_ids.add(cid)
        candidate_queries.append((label, sq, opt_type))

    add_candidate(primary_label, cleaned, "brand")
    disambiguation = processed.get("disambiguation")
    if disambiguation and str(disambiguation).lower() != cleaned.lower():
        add_candidate(str(disambiguation), str(disambiguation), "company")

    sem = asyncio.Semaphore(2)

    async def fetch_candidate(label: str, search_q: str, opt_type: str) -> dict[str, Any]:
        async with sem:
            return await preview_watch_query(search_q, label=label, opt_type=opt_type)

    previews = await asyncio.gather(
        *[fetch_candidate(label, sq, opt_type) for label, sq, opt_type in candidate_queries[:3]]
    )

    options: list[dict[str, Any]] = []
    seen_option_ids: set[str] = set()
    primary_preview = next((p for p in previews if p["query"].lower() == cleaned.lower()), previews[0] if previews else None)

    for preview in previews:
        if preview["id"] in seen_option_ids:
            continue
        seen_option_ids.add(preview["id"])
        options.append(preview)

    if primary_preview and primary_preview.get("has_live_data"):
        from app.services.search_service import run_search

        try:
            payload = await asyncio.wait_for(
                run_search(cleaned, "all", "7d", "all", "recent"),
                timeout=20.0,
            )
            primary_results = payload.get("results") or []
        except asyncio.TimeoutError:
            primary_results = []

        for headline, search_q in _related_watch_labels(cleaned, primary_results):
            opt_id = f"{search_q.lower()}::{headline.lower()}"
            if opt_id in seen_option_ids:
                continue
            seen_option_ids.add(opt_id)
            options.append(
                {
                    **primary_preview,
                    "id": opt_id,
                    "label": headline,
                    "query": search_q,
                    "type": "topic",
                }
            )

    options.sort(
        key=lambda o: (not o.get("has_live_data"), -int(o.get("total_mentions") or 0)),
    )
    return {"query": query, "options": options[:6]}


def row_to_watch_out(row: SavedSearch) -> dict[str, Any]:
    meta = parse_watch_meta(row)
    terms = build_search_terms(meta, row.query)
    return {
        "id": row.id,
        "name": watch_display_name(row, meta),
        "brand": meta.get("brand") or row.query,
        "product": meta.get("product"),
        "ceo": meta.get("ceo"),
        "aliases": meta.get("aliases") or [],
        "terms": terms,
        "threshold": int(meta.get("threshold", 70)),
        "frequency": str(meta.get("frequency", "daily")),
        "enabled": row.alert_enabled,
        "watch_type": meta.get("watch_type", "bundle" if len(terms) > 1 else "single"),
    }
