"""Claude-style cited responses for Pulse AI chat."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

GROQ_MODEL = "llama-3.3-70b-versatile"


def build_cited_system_prompt(live_results: list[dict[str, Any]], query: str) -> str:
    """Build a system prompt that forces structured, cited answers from live data."""
    source_list: list[str] = []
    for i, row in enumerate(live_results[:15], 1):
        eng = row.get("engagement") or {}
        url = row.get("url") or row.get("source_url") or ""
        source_list.append(
            f"[{i}] {str(row.get('platform', '')).upper()} | "
            f"Author: {row.get('author', 'unknown')} | "
            f"Time: {row.get('posted_at', 'unknown')} | "
            f"Sentiment: {str(row.get('sentiment', 'neutral')).upper()} | "
            f"Engagement: {eng.get('likes', 0)} likes | "
            f"Title: {str(row.get('title', ''))[:120]} | "
            f"URL: {url}"
        )

    sources_formatted = "\n".join(source_list)

    return f"""You are Pulse AI — the intelligence engine inside OpinionPulse,
an AI-powered public opinion tracking platform.

You have just fetched {len(live_results)} real, live posts from
Reddit, YouTube, Bluesky, GitHub, Mastodon, and news sources
about the user's query: "{query}"

═══════════════════════════════════════════════
LIVE DATA — USE THESE AS YOUR PRIMARY SOURCES
═══════════════════════════════════════════════
{sources_formatted}
═══════════════════════════════════════════════

STRICT RESPONSE RULES — follow every single one:

RULE 1 — ALWAYS CITE SOURCES
Every factual claim must end with [source number].
Example: "Bitcoin sentiment is predominantly positive [1][3][7]"
Never state a fact without a citation.
If you cannot cite it from the sources above, say
"I don't have enough data to confirm this."

RULE 2 — STRUCTURE EVERY RESPONSE
Never write long paragraphs. Use this exact structure:

For opinion/sentiment questions:
📊 SENTIMENT OVERVIEW
→ Overall: [Positive/Negative/Mixed] — X% positive based on Y sources
→ Most positive platform: [platform name] [citation]
→ Most negative platform: [platform name] [citation]

💡 KEY FINDINGS
→ [Finding 1 in max 12 words] [citation]
→ [Finding 2 in max 12 words] [citation]
→ [Finding 3 in max 12 words] [citation]

⚡ WHAT PEOPLE ARE ACTUALLY SAYING
→ [Direct theme from real posts, not paraphrase] [citation]
→ [Another distinct theme] [citation]

📈 TREND SIGNAL
→ Direction: [Rising/Falling/Stable]
→ Reason: [max 10 words] [citation]

🔗 TOP SOURCES
→ [1] [Platform] — [shortened title] — [URL]
→ [2] [Platform] — [shortened title] — [URL]
→ [3] [Platform] — [shortened title] — [URL]

❓ DATA CONFIDENCE
→ Sources analyzed: {len(live_results)}
→ Confidence: [Low/Medium/High] — [brief reason why]
→ What I could not determine: [honest gap]

For technical questions (how/what/why):
Use the same citation style but structure as:
📌 DIRECT ANSWER → [answer with citations]
🔍 EVIDENCE → bullet points with citations
⚠️ CAVEATS → what the data doesn't cover

For comparison questions (A vs B):
Show BOTH sides with separate citation groups when sources conflict.

RULE 3 — USE NUMBERS ALWAYS
Bad: "Many people feel positive about Bitcoin"
Good: "9 of 15 sources express positive sentiment [1][3][5][7][9][11][12][14][15]"

RULE 4 — SHOW DISAGREEMENT HONESTLY
If sources conflict, show both sides with separate citations.

RULE 5 — NEVER HALLUCINATE
If the live data doesn't contain enough information to answer, say exactly:
"The {len(live_results)} sources I fetched don't contain enough data about [specific aspect]."

RULE 6 — BE ANALYTICAL
You are a data analyst, not a storyteller. Precision beats personality.

RULE 7 — MATCH RESPONSE LENGTH TO QUESTION
Simple question → 4-6 bullet points max
Complex question → use full structure above

Your goal: make the user feel like they got a research briefing from a senior analyst.
"""


def extract_cited_sources(
    answer: str, live_results: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Map [1], [2], ... markers in the answer back to live result URLs."""
    cited_indices = re.findall(r"\[(\d+)\]", answer)
    cited_sources: list[dict[str, Any]] = []
    seen: set[int] = set()

    for idx_str in cited_indices:
        num = int(idx_str)
        if num in seen:
            continue
        seen.add(num)
        idx = num - 1
        if 0 <= idx < len(live_results):
            row = live_results[idx]
            cited_sources.append(
                {
                    "number": num,
                    "platform": row.get("platform") or "",
                    "title": str(row.get("title") or "")[:80],
                    "url": row.get("url") or row.get("source_url") or "",
                    "author": row.get("author") or "",
                    "sentiment": row.get("sentiment"),
                }
            )

    return sorted(cited_sources, key=lambda x: x["number"])


def _generate_followup_sync(query: str, results: list[dict[str, Any]]) -> list[str]:
    from app.services.chat_service import get_groq_client

    client = get_groq_client()
    if client is None:
        return [
            f"{query} latest news",
            f"{query} expert opinion",
            f"{query} future outlook",
        ]

    themes = ", ".join(str(r.get("title", ""))[:50] for r in results[:5])
    prompt = f"""
User searched for: "{query}"
AI found these key themes in the results:
{themes}

Generate exactly 3 follow-up search suggestions.
Rules:
- Each suggestion is 2-5 words
- Each explores a different angle from the main query
- Return ONLY a JSON array, nothing else:
["suggestion 1", "suggestion 2", "suggestion 3"]
"""

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=100,
        )
        content = resp.choices[0].message.content or "[]"
        suggestions = json.loads(content)
        if isinstance(suggestions, list):
            cleaned = [str(s).strip() for s in suggestions if str(s).strip()][:3]
            if len(cleaned) >= 3:
                return cleaned
    except Exception as exc:
        logger.debug("Follow-up suggestion generation failed: %s", exc)

    return [
        f"{query} latest news",
        f"{query} expert opinion",
        f"{query} future outlook",
    ]


async def generate_followup_suggestions(
    query: str, answer: str, results: list[dict[str, Any]]
) -> list[str]:
    del answer
    return await asyncio.to_thread(_generate_followup_sync, query, results)
