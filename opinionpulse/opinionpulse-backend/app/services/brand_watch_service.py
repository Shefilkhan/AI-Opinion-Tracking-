"""Brand & reputation watchlists — bundled terms, baseline vs spike, merged search."""

from __future__ import annotations

import json
from typing import Any

from app.db.models import SavedSearch


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
