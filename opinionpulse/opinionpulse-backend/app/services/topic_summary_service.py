"""Build a readable topic summary from live search results (no AI required)."""

from __future__ import annotations

from typing import Any


def _sentiment_tone(pos: float, neg: float, neu: float) -> str:
    if pos > neg + 15:
        return "largely positive"
    if neg > pos + 15:
        return "largely negative"
    if neu >= 55:
        return "mostly neutral"
    return "mixed"


def _platform_label(name: str) -> str:
    labels = {
        "reddit": "Reddit",
        "youtube": "YouTube",
        "newsapi": "News",
        "guardian": "The Guardian",
        "hackernews": "Hacker News",
        "devto": "Dev.to",
        "github": "GitHub",
        "stackoverflow": "Stack Overflow",
        "bluesky": "Bluesky",
        "mastodon": "Mastodon",
        "gnews": "GNews",
        "currents": "Currents",
        "mediastack": "Mediastack",
    }
    return labels.get(name.lower(), name.replace("_", " ").title())


def build_topic_summary(
    query: str,
    results: list[dict[str, Any]],
    sentiment_summary: dict[str, float],
    platforms_searched: list[str],
    most_active_platform: str | None,
    trending_keywords: list[dict[str, Any]],
    wiki_summary: dict[str, Any] | None,
    total_results: int,
) -> dict[str, Any]:
    """Synthesize an at-a-glance summary for the searched topic."""
    pos = round(sentiment_summary.get("positive", 0))
    neg = round(sentiment_summary.get("negative", 0))
    neu = round(sentiment_summary.get("neutral", 0))
    tone = _sentiment_tone(pos, neg, neu)

    paragraphs: list[str] = []

    if wiki_summary and wiki_summary.get("summary"):
        paragraphs.append(wiki_summary["summary"].strip())

    if total_results > 0:
        platform_list = [_platform_label(p) for p in platforms_searched[:6]]
        if len(platforms_searched) > 6:
            platform_list.append(f"{len(platforms_searched) - 6} more")
        platforms_text = ", ".join(platform_list)

        pulse = (
            f"OpinionPulse analyzed {total_results} live mention"
            f"{'s' if total_results != 1 else ''} about \"{query}\" "
            f"from {len(platforms_searched)} source"
            f"{'s' if len(platforms_searched) != 1 else ''} "
            f"({platforms_text}). "
            f"Overall sentiment is {tone}: {pos}% positive, {neu}% neutral, "
            f"{neg}% negative."
        )
        if most_active_platform:
            pulse += (
                f" The most active platform is "
                f"{_platform_label(most_active_platform)}."
            )
        paragraphs.append(pulse)
    elif not paragraphs:
        paragraphs.append(
            f"No live mentions were found for \"{query}\" in the selected "
            "time range. Try a broader time window or a different keyword."
        )

    highlights: list[str] = []
    seen: set[str] = set()
    for row in results:
        title = (row.get("title") or "").strip()
        snippet = title or (row.get("content") or "").strip()
        snippet = " ".join(snippet.split())
        if len(snippet) < 12:
            continue
        key = snippet.lower()[:80]
        if key in seen:
            continue
        seen.add(key)
        highlights.append(snippet[:140] + ("…" if len(snippet) > 140 else ""))
        if len(highlights) >= 4:
            break

    top_keywords = [
        str(k.get("word", "")).strip()
        for k in trending_keywords[:8]
        if str(k.get("word", "")).strip()
    ]

    return {
        "query": query,
        "overview": "\n\n".join(paragraphs),
        "highlights": highlights,
        "top_keywords": top_keywords,
        "sentiment_tone": tone,
        "total_mentions": total_results,
        "sources_count": len(platforms_searched),
    }
