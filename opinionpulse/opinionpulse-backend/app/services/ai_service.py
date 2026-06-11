"""Anthropic Claude-powered opinion analysis."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from app.core.config import get_settings
from app.services.cache_utils import get_cached, set_cached

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 1024
AI_TIMEOUT_SECONDS = 15.0
AI_CACHE_TTL = 600

_client: Any = None


def ai_available() -> bool:
    return bool(get_settings().anthropic_api_key.strip())


def _get_client():
    global _client
    if not ai_available():
        return None
    if _client is None:
        import anthropic

        _client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key.strip())
    return _client


def _cache_key(prefix: str, *parts: str) -> str:
    slug = "_".join(p.lower().replace(" ", "_") for p in parts if p)
    return f"{prefix}_{slug}"


def _parse_json_response(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group())
        raise


def _call_claude(prompt: str) -> str:
    client = _get_client()
    if client is None:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")
    message = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


async def _claude_json(prompt: str) -> dict[str, Any]:
    text = await asyncio.wait_for(
        asyncio.to_thread(_call_claude, prompt),
        timeout=AI_TIMEOUT_SECONDS,
    )
    return _parse_json_response(text)


def _result_context(results: list[dict[str, Any]], limit: int = 10) -> str:
    lines = []
    for r in results[:limit]:
        title = r.get("title") or r.get("content", "")[:80]
        content = (r.get("content") or "")[:150]
        platform = r.get("platform", "unknown")
        lines.append(f"- [{platform}] {title}: {content}")
    return "\n".join(lines) if lines else "No posts available."


async def generate_opinion_summary(
    query: str,
    results: list[dict[str, Any]],
    sentiment_summary: dict[str, Any],
) -> dict[str, Any]:
    cache_key = _cache_key("ai_summary", query)
    cached = get_cached(cache_key)
    if cached:
        return cached

    if not ai_available():
        return _fallback_summary(query)

    context = _result_context(results, 10)
    prompt = f"""You are an expert public opinion analyst.

Analyze public opinion about "{query}" based on these
real social media posts and news articles:

{context}

Sentiment data:
- {sentiment_summary.get('positive', 0)}% Positive
- {sentiment_summary.get('negative', 0)}% Negative
- {sentiment_summary.get('neutral', 0)}% Neutral

Provide a structured analysis in this EXACT JSON format:
{{
    "headline": "One punchy sentence summarizing overall public opinion (max 20 words)",
    "overview": "2-3 sentence balanced overview of what people think about this topic",
    "why_positive": "One sentence explaining the main reason people feel positive",
    "why_negative": "One sentence explaining the main reason people feel negative",
    "key_insight": "One surprising or interesting insight from the data",
    "verdict": "overall_positive OR overall_negative OR deeply_divided OR mostly_neutral",
    "confidence": "high OR medium OR low",
    "one_liner": "A single memorable sentence that captures the public mood"
}}

Return ONLY the JSON object. No markdown, no explanation."""

    try:
        summary = await _claude_json(prompt)
        set_cached(cache_key, summary, AI_CACHE_TTL)
        return summary
    except Exception as exc:
        logger.error("AI Summary failed: %s", exc)
        return _fallback_summary(query)


def _fallback_summary(query: str) -> dict[str, Any]:
    return {
        "headline": f"Mixed opinions found about {query}",
        "overview": f"Public opinion on {query} is divided across platforms.",
        "why_positive": "Some users express support and optimism.",
        "why_negative": "Others raise concerns and criticisms.",
        "key_insight": "Discussion is active across multiple platforms.",
        "verdict": "deeply_divided",
        "confidence": "low",
        "one_liner": f"The world has strong feelings about {query}.",
    }


async def analyze_debate(
    topic: str,
    results: list[dict[str, Any]],
) -> dict[str, Any]:
    cache_key = _cache_key("ai_debate", topic)
    cached = get_cached(cache_key)
    if cached:
        return cached

    if not ai_available():
        return _fallback_debate(topic)

    positive_results = [r for r in results if r.get("sentiment") == "positive"][:5]
    negative_results = [r for r in results if r.get("sentiment") == "negative"][:5]

    pro_context = "\n".join(
        f"- {r.get('title', '')}: {(r.get('content') or '')[:120]}"
        for r in positive_results
    )
    con_context = "\n".join(
        f"- {r.get('title', '')}: {(r.get('content') or '')[:120]}"
        for r in negative_results
    )

    prompt = f"""You are an expert debate analyst and political scientist.

Analyze the public debate about "{topic}" using these real sources:

SUPPORTING ARGUMENTS (from positive sentiment posts):
{pro_context if pro_context else "Limited positive coverage found"}

OPPOSING ARGUMENTS (from negative sentiment posts):
{con_context if con_context else "Limited negative coverage found"}

Provide a structured debate analysis in this EXACT JSON format:
{{
    "debate_title": "Engaging debate question format (e.g. 'Is X good for Y?')",
    "pro_side": {{
        "label": "Short label for pro side (e.g. 'Supporters', 'Optimists')",
        "strongest_argument": "The best argument in favor (1-2 sentences)",
        "supporting_points": ["point 1", "point 2", "point 3"],
        "who_believes_this": "Description of who typically holds this view"
    }},
    "con_side": {{
        "label": "Short label for con side (e.g. 'Critics', 'Skeptics')",
        "strongest_argument": "The best argument against (1-2 sentences)",
        "opposing_points": ["point 1", "point 2", "point 3"],
        "who_believes_this": "Description of who typically holds this view"
    }},
    "middle_ground": "A balanced compromise position both sides might accept",
    "verdict": "who_winning OR too_close OR no_winner",
    "winning_side": "pro OR con OR neither",
    "debate_intensity": "low OR medium OR high OR explosive",
    "expert_take": "What experts and analysts generally conclude about this topic"
}}

Return ONLY the JSON object. Be objective and balanced."""

    try:
        analysis = await _claude_json(prompt)
        set_cached(cache_key, analysis, AI_CACHE_TTL)
        return analysis
    except Exception as exc:
        logger.error("AI Debate failed: %s", exc)
        return _fallback_debate(topic)


def _fallback_debate(topic: str) -> dict[str, Any]:
    return {
        "debate_title": f"What do people think about {topic}?",
        "pro_side": {
            "label": "Supporters",
            "strongest_argument": "Many people see positive aspects.",
            "supporting_points": [
                "Broad support exists",
                "Growing interest",
                "Positive outcomes reported",
            ],
            "who_believes_this": "Optimists and supporters",
        },
        "con_side": {
            "label": "Critics",
            "strongest_argument": "Significant concerns have been raised.",
            "opposing_points": [
                "Valid criticisms exist",
                "Risks identified",
                "Problems reported",
            ],
            "who_believes_this": "Skeptics and critics",
        },
        "middle_ground": "A balanced approach considering both perspectives.",
        "verdict": "too_close",
        "winning_side": "neither",
        "debate_intensity": "medium",
        "expert_take": "Experts recommend careful consideration of all factors.",
    }


async def predict_opinion_trend(
    query: str,
    results: list[dict[str, Any]],
    sentiment_summary: dict[str, Any],
    time_range: str,
) -> dict[str, Any]:
    cache_key = _cache_key("ai_predict", query, time_range)
    cached = get_cached(cache_key)
    if cached:
        return cached

    if not ai_available():
        return _fallback_prediction(query)

    platforms: dict[str, int] = {}
    for r in results:
        p = r.get("platform") or "unknown"
        platforms[p] = platforms.get(p, 0) + 1

    sorted_results = sorted(
        results, key=lambda x: x.get("posted_at", ""), reverse=True
    )
    mid = len(sorted_results) // 2
    recent_half = sorted_results[: max(mid, 1)]
    older_half = sorted_results[mid:] or sorted_results

    recent_pos = sum(1 for r in recent_half if r.get("sentiment") == "positive")
    older_pos = sum(1 for r in older_half if r.get("sentiment") == "positive")
    recent_pos_pct = round((recent_pos / max(len(recent_half), 1)) * 100)
    older_pos_pct = round((older_pos / max(len(older_half), 1)) * 100)
    sentiment_shift = recent_pos_pct - older_pos_pct

    top_platform = max(platforms, key=platforms.get) if platforms else "unknown"

    prompt = f"""You are an expert in public opinion trends and social media analytics.

Analyze the trend for public opinion about "{query}":

Current sentiment: {sentiment_summary.get('positive', 0)}% positive,
{sentiment_summary.get('negative', 0)}% negative
Time period analyzed: {time_range}
Total data points: {len(results)}
Platform distribution: {platforms}
Sentiment shift (recent vs older): {sentiment_shift:+d}%
(positive = sentiment improving, negative = sentiment worsening)
Most active platform: {top_platform}

Predict the trend in this EXACT JSON format:
{{
    "direction": "rising OR falling OR stable OR volatile",
    "prediction": "One clear sentence predicting where opinion is heading in next 7 days",
    "confidence_level": 1-10 integer,
    "reasoning": "2-3 sentences explaining why this trend is happening",
    "turning_point": "What event or factor could reverse this trend",
    "watch_for": "One specific thing to monitor that will confirm or deny this prediction",
    "sentiment_momentum": "accelerating_positive OR slowing_positive OR accelerating_negative OR slowing_negative OR flat",
    "key_drivers": ["driver 1", "driver 2", "driver 3"],
    "risk_factors": ["risk 1", "risk 2"],
    "short_forecast": "7-day outlook in one sentence",
    "platform_insight": "Which platform is driving the narrative and why"
}}

Be specific and data-driven. Return ONLY the JSON object."""

    try:
        prediction = await _claude_json(prompt)
        if isinstance(prediction.get("confidence_level"), str):
            try:
                prediction["confidence_level"] = int(prediction["confidence_level"])
            except ValueError:
                prediction["confidence_level"] = 5
        set_cached(cache_key, prediction, AI_CACHE_TTL)
        return prediction
    except Exception as exc:
        logger.error("AI Prediction failed: %s", exc)
        return _fallback_prediction(query)


def _fallback_prediction(query: str) -> dict[str, Any]:
    return {
        "direction": "stable",
        "prediction": f"Public opinion on {query} is expected to remain mixed.",
        "confidence_level": 5,
        "reasoning": "Current data shows balanced discussion without clear momentum.",
        "turning_point": "A major news event could shift opinion significantly.",
        "watch_for": "Changes in mainstream media coverage.",
        "sentiment_momentum": "flat",
        "key_drivers": ["Media coverage", "Social discussions", "Recent events"],
        "risk_factors": ["Unexpected news", "Viral content"],
        "short_forecast": "Expect continued mixed sentiment over the next 7 days.",
        "platform_insight": "Discussion spread evenly across platforms.",
    }


async def generate_insight_of_the_day() -> dict[str, Any] | None:
    """Summarize the top most-discussed topic for the dashboard widget."""
    from app.services.dashboard_debates_service import get_most_discussed
    from app.services.search_service import search_all_platforms

    discussed = get_most_discussed()
    if not discussed:
        return None

    top = discussed[0]
    query = top.get("query") or top.get("topic", "")
    topic_label = top.get("topic", query)

    results = await search_all_platforms(query, "7d")
    if len(results) < 3:
        return {
            "topic": topic_label,
            "query": query,
            "headline": f"{topic_label} is widely discussed this week.",
            "overview": top.get("top_result", {}).get("title", "")[:200]
            if top.get("top_result")
            else f"Conversation about {topic_label} spans multiple platforms.",
            "one_liner": f"Watch {topic_label} as engagement continues to build.",
            "verdict": "deeply_divided",
        }

    sentiment = top.get("sentiment") or {"positive": 50, "negative": 30, "neutral": 20}
    summary = await generate_opinion_summary(query, results, sentiment)
    return {
        "topic": topic_label,
        "query": query,
        "headline": summary.get("headline", ""),
        "overview": summary.get("overview", ""),
        "one_liner": summary.get("one_liner", ""),
        "verdict": summary.get("verdict", "deeply_divided"),
    }


async def generate_crisis_response(
    topic: str,
    results: list[dict[str, Any]],
) -> dict[str, Any]:
    cache_key = _cache_key("ai_crisis", topic)
    cached = get_cached(cache_key)
    if cached:
        return cached

    if not ai_available():
        return _fallback_crisis_response(topic)

    negative_results = [r for r in results if r.get("sentiment") == "negative"][:10]
    con_context = "\n".join(
        f"- {r.get('title', '')}: {(r.get('content') or '')[:150]}"
        for r in negative_results
    )

    prompt = f"""You are an elite Public Relations and Crisis Management expert.

Your client is facing negative public sentiment regarding "{topic}".
Here are the recent negative posts and complaints from social media:

{con_context if con_context else "No specific negative posts found."}

Generate a comprehensive crisis response strategy in this EXACT JSON format:
{{
    "severity_assessment": "low OR medium OR high OR critical",
    "core_issue": "One sentence summarizing the root cause of the outrage",
    "pr_statement": "A professionally written 3-paragraph PR statement addressing the concerns directly, taking accountability if necessary, and offering a path forward",
    "suggested_tweet": "A short, empathetic 280-character tweet linking to the statement",
    "dos": ["Do 1", "Do 2", "Do 3"],
    "donts": ["Don't 1", "Don't 2"]
}}

Return ONLY the JSON object. Be empathetic, professional, and strategic."""

    try:
        response = await _claude_json(prompt)
        set_cached(cache_key, response, AI_CACHE_TTL)
        return response
    except Exception as exc:
        logger.error("AI Crisis Response failed: %s", exc)
        return _fallback_crisis_response(topic)


def _fallback_crisis_response(topic: str) -> dict[str, Any]:
    return {
        "severity_assessment": "medium",
        "core_issue": f"Users are expressing dissatisfaction regarding {topic}.",
        "pr_statement": f"We hear you. We understand there are concerns about {topic}, and we take this feedback seriously. Our team is actively investigating the issues raised by our community.\n\nWe are committed to transparency and will provide updates as we learn more. Thank you for holding us accountable.\n\nPlease reach out to our support team if you have further questions.",
        "suggested_tweet": f"We hear the community's concerns regarding {topic}. We're actively looking into it and are committed to making things right. Read our full statement here: [Link]",
        "dos": ["Acknowledge the issue", "Be transparent", "Provide a timeline"],
        "donts": ["Get defensive", "Ignore the problem", "Delete comments"]
    }

