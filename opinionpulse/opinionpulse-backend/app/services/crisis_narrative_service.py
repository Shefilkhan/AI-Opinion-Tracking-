"""Cluster mentions into distinct crisis narratives (AI + heuristic fallback)."""

from __future__ import annotations

import json
import logging
import re
from collections import Counter
from typing import Any
from uuid import uuid4

from app.services.ai_service import ai_available
from app.services.keywords_utils import extract_keywords_from_results

logger = logging.getLogger(__name__)

_SEVERITY_KEYWORDS = {
    "critical": ("breach", "hack", "leak", "cve", "exploit", "lawsuit", "fraud"),
    "high": ("outage", "down", "broken", "scam", "privacy", "security", "ban"),
    "medium": ("bug", "issue", "complaint", "disappointed", "slow", "error"),
}


def _guess_severity(text: str) -> str:
    lower = text.lower()
    for level, words in _SEVERITY_KEYWORDS.items():
        if any(w in lower for w in words):
            return level
    return "low"


def _heuristic_narratives(query: str, results: list[dict], *, max_n: int = 4) -> list[dict]:
    """Group by platform + top keywords when AI is unavailable."""
    negative = [r for r in results if (r.get("sentiment") or "").lower() == "negative"]
    pool = negative or results
    if not pool:
        return []

    keywords = extract_keywords_from_results(pool[:30])
    top_words = [k["word"] for k in keywords[:3]] or query.split()[:2]

    by_platform: dict[str, list[dict]] = {}
    for row in pool:
        plat = (row.get("platform") or "unknown").lower()
        by_platform.setdefault(plat, []).append(row)

    narratives: list[dict] = []
    for plat, rows in sorted(by_platform.items(), key=lambda x: -len(x[1]))[:max_n]:
        sample = rows[0]
        label_bits = top_words[:2] + [plat]
        label = " · ".join(w.title() for w in label_bits if w)
        neg = sum(1 for r in rows if (r.get("sentiment") or "") == "negative")
        neg_pct = round(neg / len(rows) * 100, 1) if rows else 0.0
        snippet = (sample.get("content") or sample.get("title") or "")[:180]
        combined = f"{query} {snippet}"
        narratives.append(
            {
                "id": str(uuid4()),
                "label": label or f"{plat.title()} discussion",
                "summary": (
                    f"{len(rows)} mentions on {plat} — "
                    f"{'mostly negative' if neg_pct > 50 else 'mixed sentiment'}."
                ),
                "severity": _guess_severity(combined),
                "negative_pct": neg_pct,
                "mention_count": len(rows),
                "primary_platform": plat,
                "example_snippet": snippet,
                "example_url": sample.get("source_url"),
            }
        )
    return narratives


async def cluster_narratives(
    query: str,
    results: list[dict],
    *,
    max_n: int = 4,
) -> list[dict]:
    """Return narrative clusters for crisis detail view."""
    if not results:
        return []

    if not ai_available():
        return _heuristic_narratives(query, results, max_n=max_n)

    negative = [r for r in results if (r.get("sentiment") or "").lower() == "negative"]
    sample_pool = (negative or results)[:25]
    lines = []
    for i, row in enumerate(sample_pool, 1):
        plat = row.get("platform", "?")
        text = (row.get("content") or row.get("title") or "")[:160]
        lines.append(f"{i}. [{plat}] {text}")

    from app.services.ai_service import _claude_json

    prompt = f"""You are a PR crisis analyst. Group these social mentions about "{query}" into {max_n} distinct NARRATIVES (different stories/causes of negativity).

Mentions:
{chr(10).join(lines)}

Return ONLY a JSON object:
{{
  "narratives": [
    {{
      "label": "Short narrative title",
      "summary": "One sentence",
      "severity": "low|medium|high|critical",
      "negative_pct": 0,
      "mention_count": 0,
      "primary_platform": "reddit",
      "example_snippet": "quote"
    }}
  ]
}}

Focus on DISTINCT causes (outage vs CEO tweet vs leak). Return valid JSON only."""

    try:
        raw = await _claude_json(prompt)
        items = raw if isinstance(raw, list) else raw.get("narratives", [])
        out: list[dict] = []
        for item in items[:max_n]:
            if not isinstance(item, dict):
                continue
            out.append(
                {
                    "id": str(uuid4()),
                    "label": str(item.get("label", "Unnamed narrative"))[:120],
                    "summary": str(item.get("summary", ""))[:300],
                    "severity": str(item.get("severity", "medium"))[:20],
                    "negative_pct": float(item.get("negative_pct", 50)),
                    "mention_count": int(item.get("mention_count", 1)),
                    "primary_platform": str(item.get("primary_platform", "unknown"))[:50],
                    "example_snippet": str(item.get("example_snippet", ""))[:200],
                    "example_url": None,
                }
            )
        if out:
            return out
    except Exception as exc:
        logger.warning("AI narrative clustering failed: %s", exc)

    return _heuristic_narratives(query, results, max_n=max_n)
