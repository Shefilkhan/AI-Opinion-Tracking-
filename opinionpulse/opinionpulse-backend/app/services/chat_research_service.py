"""Research-style Pulse AI responses with numbered source references."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from dateutil.parser import parse as parse_date

PLATFORM_LABELS = {
    "reddit": "REDDIT",
    "youtube": "YOUTUBE",
    "news": "NEWS",
    "guardian": "GUARDIAN",
    "hackernews": "HN",
    "devto": "DEVTO",
    "bluesky": "BLUESKY",
    "mastodon": "MASTODON",
    "github": "GITHUB",
    "stackoverflow": "STACK",
}


def _year_from_posted(posted_at: str | None) -> str:
    if not posted_at:
        return str(datetime.now(timezone.utc).year)
    try:
        return str(parse_date(str(posted_at)).year)
    except Exception:
        return str(datetime.now(timezone.utc).year)


def _best_quote(result: dict[str, Any]) -> str:
    text = (result.get("content") or result.get("title") or "").strip()
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    for sentence in sentences:
        cleaned = sentence.strip()
        if len(cleaned) >= 40:
            return cleaned[:240]
    return text[:240]


def build_references(results: list[dict[str, Any]], limit: int = 10) -> list[dict[str, Any]]:
    """Numbered sources for citation-backed answers (built from live search results)."""
    refs: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for row in results:
        url = (row.get("source_url") or row.get("url") or "").strip()
        if url and url in seen_urls:
            continue
        if url:
            seen_urls.add(url)

        platform = (row.get("platform") or "news").lower()
        label_prefix = PLATFORM_LABELS.get(platform, platform.upper()[:8])
        year = _year_from_posted(row.get("posted_at"))
        ref_id = len(refs) + 1

        engagement = row.get("engagement") or {}
        refs.append(
            {
                "id": ref_id,
                "citation_label": f"{label_prefix} {year}",
                "title": (row.get("title") or "Untitled")[:220],
                "platform": platform,
                "author": (row.get("author") or row.get("publication") or "Unknown")[:120],
                "source_url": url,
                "source_label": row.get("source_label") or platform,
                "key_takeaway": (row.get("content") or row.get("title") or "")[:220],
                "supporting_quote": _best_quote(row),
                "sentiment": row.get("sentiment") or "neutral",
                "posted_at": row.get("posted_at"),
                "engagement": {
                    "likes": int(engagement.get("likes") or 0),
                    "comments": int(engagement.get("comments") or 0),
                    "shares": int(engagement.get("shares") or 0),
                    "views": int(engagement.get("views") or 0),
                },
            }
        )
        if len(refs) >= limit:
            break
    return refs


def build_research_steps(query: str, results_count: int, ref_count: int) -> list[str]:
    return [
        f"Searched live sources for “{query}” ({results_count} posts)",
        f"Ranked by relevance and recency ({ref_count} sources selected)",
        f"Read titles, excerpts, and sentiment signals",
    ]


def build_research_context_for_llm(
    query: str,
    references: list[dict[str, Any]],
    sentiment: dict[str, Any],
    wiki_summary: dict | None,
) -> str:
    lines = [
        f'TOPIC: "{query}"',
        f"Sentiment mix: {sentiment.get('positive', 0)}% positive · "
        f"{sentiment.get('negative', 0)}% negative · "
        f"{sentiment.get('neutral', 0)}% neutral",
        "",
        "NUMBERED SOURCES (cite ONLY using [1], [2], … matching id):",
    ]
    for ref in references:
        lines.append(
            f"[{ref['id']}] {ref['title']} — {ref['platform']} ({ref['sentiment']})"
        )
        if ref.get("supporting_quote"):
            lines.append(f'    Quote: "{ref["supporting_quote"]}"')
    if wiki_summary and isinstance(wiki_summary, dict):
        summary = str(wiki_summary.get("summary", ""))[:200]
        if summary:
            lines.append(f"\nWikipedia context: {summary}")
    lines.append(
        "\nRules: Use ONLY these sources. Every claim needs [id] citations. "
        "Do not invent statistics, papers, or citation counts."
    )
    return "\n".join(lines)


def validate_research_structured(
    payload: dict[str, Any], ref_count: int
) -> dict[str, Any]:
    """Ensure evidence_ids point to real references."""
    if payload.get("type") != "research_brief":
        return payload

    valid_ids = set(range(1, ref_count + 1))

    def _clean_ids(raw: Any) -> list[int]:
        if not isinstance(raw, list):
            return []
        out: list[int] = []
        for item in raw:
            try:
                num = int(item)
            except (TypeError, ValueError):
                continue
            if num in valid_ids and num not in out:
                out.append(num)
        return out[:4]

    aspects = payload.get("aspects") or []
    cleaned_aspects = []
    for row in aspects:
        if not isinstance(row, dict):
            continue
        cleaned_aspects.append(
            {
                "aspect": str(row.get("aspect") or "Topic")[:80],
                "summary": str(row.get("summary") or "")[:400],
                "evidence_ids": _clean_ids(row.get("evidence_ids")),
            }
        )

    payload["aspects"] = cleaned_aspects[:6]
    payload["title"] = str(payload.get("title") or "Research Overview")[:120]
    payload["overview"] = str(payload.get("overview") or "")[:1200]
    payload["steps"] = [
        str(s)[:120] for s in (payload.get("steps") or []) if str(s).strip()
    ][:4]
    return payload


def format_research_markdown(structured: dict[str, Any]) -> str:
    """Human-readable fallback body from structured research payload."""
    parts = [f"### {structured.get('title', 'Research Overview')}", ""]
    overview = structured.get("overview") or ""
    if overview:
        parts.append(overview)
        parts.append("")

    aspects = structured.get("aspects") or []
    if aspects:
        parts.append("### What research says")
        parts.append("| Aspect | Summary | Evidence |")
        parts.append("| --- | --- | --- |")
        for row in aspects:
            ids = row.get("evidence_ids") or []
            badges = " ".join(f"[{i}]" for i in ids) if ids else "—"
            summary = str(row.get("summary", "")).replace("|", "/")
            aspect = str(row.get("aspect", "")).replace("|", "/")
            parts.append(f"| {aspect} | {summary} | {badges} |")
        parts.append("")

    return "\n".join(parts).strip()

RESEARCH_FORMAT_HINT = """Use TEMPLATE G — Research brief (MANDATORY when numbered sources are provided).

Write like a research analyst: overview paragraph with inline [1] [2] citations after each claim.
Use **bold** for key terms. Title format: "[Topic] Research Overview".

Then append this exact block:

---STRUCTURED---
{
  "type": "research_brief",
  "title": "[Topic] Research Overview",
  "overview": "2-4 sentences with [1] [2] citations. Bold key terms with **double asterisks**.",
  "steps": ["Searched live sources for \\"[query]\\" (N posts)", "Ranked by relevance and sentiment", "Selected top sources for evidence"],
  "aspects": [
    {"aspect": "Economic role", "summary": "What sources say with **bold key terms** and [1] citations", "evidence_ids": [1, 2]},
    {"aspect": "Public sentiment", "summary": "...", "evidence_ids": [3, 4]},
    {"aspect": "Key debates", "summary": "...", "evidence_ids": [5]}
  ]
}
---END---

SUGGESTIONS: ["follow-up 1", "follow-up 2", "follow-up 3"]

Rules:
• ONLY cite source ids from the NUMBERED SOURCES list — never invent papers or stats.
• aspects: 3-5 rows (sentiment, trends, risks, debate, market behavior, etc.).
• Every aspect summary must include at least one evidence_id.
• If data is thin, say so honestly and cite what exists."""
