"""Evidence bundle builder for Pulse AI — structured, ID-tagged evidence."""

from __future__ import annotations

import hashlib
from typing import Any


def _stable_id(prefix: str, row: dict[str, Any]) -> str:
    raw = f"{row.get('platform','')}-{row.get('url','')}-{row.get('content','')[:40]}"
    h = hashlib.md5(raw.encode()).hexdigest()[:8]
    return f"{prefix}-{h}"


def tag_mentions(results: list[dict[str, Any]], *, limit: int = 25) -> list[dict[str, Any]]:
    tagged: list[dict[str, Any]] = []
    for i, row in enumerate(results[:limit]):
        ct = (row.get("content_type") or "post").lower()
        prefix = "yt-comment" if ct == "comment" else "yt-reply" if ct == "reply" else row.get("platform", "item")
        item = dict(row)
        item["evidence_id"] = _stable_id(str(prefix), row)
        item["citation_number"] = i + 1
        tagged.append(item)
    return tagged


def build_evidence_bundle(
    *,
    question: str,
    router_intent: str,
    search_results: list[dict[str, Any]] | None = None,
    intelligence: dict[str, Any] | None = None,
    wiki_summary: dict | None = None,
    web_results: list[dict[str, Any]] | None = None,
    x_results: list[dict[str, Any]] | None = None,
    comparison: dict[str, Any] | None = None,
    source_health: dict[str, str] | None = None,
    tool_errors: list[str] | None = None,
) -> dict[str, Any]:
    mentions = tag_mentions(search_results or [], limit=20)
    bundle: dict[str, Any] = {
        "question": question,
        "intent": router_intent,
        "factual_sources": web_results or [],
        "x_sources": x_results or [],
        "opinionpulse": {},
        "representative_mentions": mentions,
        "comparison": comparison,
        "wiki": wiki_summary,
        "source_health": source_health or {},
        "tool_errors": tool_errors or [],
    }

    if intelligence:
        bundle["opinionpulse"] = {
            "query": intelligence.get("query"),
            "coverage": intelligence.get("content_breakdown"),
            "sentiment": intelligence.get("sentiment_summary"),
            "platforms": intelligence.get("platform_stats", []),
            "themes": intelligence.get("themes", []),
            "insights": intelligence.get("insights", []),
            "confidence": intelligence.get("confidence"),
            "period_comparison": intelligence.get("period_comparison"),
            "youtube_summary": intelligence.get("youtube_summary"),
        }
    elif search_results:
        from app.services.chat_service import _sentiment_summary

        bundle["opinionpulse"] = {
            "sentiment": _sentiment_summary(search_results),
            "results_count": len(search_results),
        }

    return bundle


def compute_analysis_confidence(bundle: dict[str, Any]) -> dict[str, Any]:
    op = bundle.get("opinionpulse") or {}
    coverage = op.get("coverage") or {}
    total = coverage.get("total") or op.get("results_count") or len(bundle.get("representative_mentions") or [])
    conf = op.get("confidence") or {}
    level = conf.get("level") or ("high" if total >= 80 else "medium" if total >= 25 else "low")
    sources = len(bundle.get("factual_sources") or []) + len(bundle.get("representative_mentions") or [])
    return {
        "level": level.upper() if isinstance(level, str) else "LOW",
        "label": f"Analysis confidence: {str(level).upper()}",
        "total_items": total,
        "sources_referenced": sources,
        "explanation": conf.get("explanation")
        or (
            f"Based on {total} analyzed content items."
            if total >= 15
            else "Limited relevant data — interpret cautiously."
        ),
    }


def format_evidence_for_llm(bundle: dict[str, Any]) -> str:
    """Serialize evidence bundle as JSON for the answer model."""
    import json

    slim = {
        "question": bundle.get("question"),
        "intent": bundle.get("intent"),
        "analysis_confidence": compute_analysis_confidence(bundle),
        "opinionpulse": bundle.get("opinionpulse"),
        "representative_mentions": [
            {
                "id": m.get("evidence_id"),
                "n": m.get("citation_number"),
                "platform": m.get("platform"),
                "content_type": m.get("content_type"),
                "text": (m.get("title") or m.get("content") or "")[:200],
                "sentiment": m.get("sentiment"),
                "url": m.get("source_url") or m.get("url"),
            }
            for m in (bundle.get("representative_mentions") or [])[:15]
        ],
        "factual_sources": (bundle.get("factual_sources") or [])[:5],
        "x_sources": (bundle.get("x_sources") or [])[:5],
        "wiki": bundle.get("wiki"),
        "comparison": bundle.get("comparison"),
        "source_health": bundle.get("source_health"),
        "tool_errors": bundle.get("tool_errors"),
    }
    return (
        "EVIDENCE BUNDLE (use only this data for numbers and citations):\n"
        f"```json\n{json.dumps(slim, indent=2, default=str)}\n```\n"
        "Cite mention IDs as [N] matching citation_number."
    )
