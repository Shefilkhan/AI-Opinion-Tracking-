"""AI response brief — 3 talking points + 2 risks from live results only."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.services.ai_service import ai_available
from app.services.cache_utils import get_cached, set_cached

logger = logging.getLogger(__name__)
BRIEF_CACHE_TTL = 300


def _fallback_brief(topic: str, results: list[dict[str, Any]]) -> dict[str, Any]:
    snippets = [
        (r.get("content") or r.get("title") or "")[:120]
        for r in results[:5]
        if (r.get("content") or r.get("title"))
    ]
    return {
        "topic": topic,
        "talking_points": [
            f"Acknowledge community feedback about {topic} with transparency.",
            "Share what you know today and what you're still verifying.",
            "Point to your official channel for updates and support.",
        ],
        "risks": [
            "Ignoring accelerated negative mentions may widen the narrative gap.",
            "Speculative claims without sourced facts can erode trust further.",
        ],
        "source_count": len(results),
        "sample_snippets": snippets[:3],
        "ai_generated": False,
    }


async def generate_response_brief(
    topic: str,
    results: list[dict[str, Any]],
) -> dict[str, Any]:
    """Generate 3 talking points + 2 risks grounded in provided search results."""
    cache_key = f"response_brief_{topic.lower().replace(' ', '_')}_{len(results)}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    if not results:
        out = _fallback_brief(topic, [])
        set_cached(cache_key, out, BRIEF_CACHE_TTL)
        return out

    if not ai_available():
        out = _fallback_brief(topic, results)
        set_cached(cache_key, out, BRIEF_CACHE_TTL)
        return out

    lines = []
    for i, row in enumerate(results[:12], 1):
        platform = row.get("platform", "?")
        sentiment = row.get("sentiment", "neutral")
        text = f"{row.get('title', '')} {(row.get('content') or '')[:180]}".strip()
        lines.append(f"[{i}] ({platform}, {sentiment}) {text}")

    from app.services.ai_service import _claude_json

    prompt = f"""You are a PR advisor. Using ONLY the live posts below about "{topic}", produce a response brief.

POSTS:
{chr(10).join(lines)}

Return ONLY this JSON:
{{
  "talking_points": ["point 1", "point 2", "point 3"],
  "risks": ["risk 1", "risk 2"]
}}

Rules:
- Exactly 3 talking points and 2 risks.
- Each item is one actionable sentence.
- Do NOT invent statistics, lawsuits, or events not supported by the posts.
- If data is thin, say so in the talking points."""

    try:
        payload = await _claude_json(prompt)
        out = {
            "topic": topic,
            "talking_points": (payload.get("talking_points") or [])[:3],
            "risks": (payload.get("risks") or [])[:2],
            "source_count": len(results),
            "sample_snippets": lines[:3],
            "ai_generated": True,
        }
        if len(out["talking_points"]) < 3:
            fb = _fallback_brief(topic, results)
            out["talking_points"] = fb["talking_points"]
        if len(out["risks"]) < 2:
            fb = _fallback_brief(topic, results)
            out["risks"] = fb["risks"]
        set_cached(cache_key, out, BRIEF_CACHE_TTL)
        return out
    except Exception as exc:
        logger.error("Response brief AI failed: %s", exc)
        out = _fallback_brief(topic, results)
        set_cached(cache_key, out, BRIEF_CACHE_TTL)
        return out
