"""Pulse AI — Groq (Llama 3.3 70B) chat with live platform data."""

from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Any

from app.core.config import get_settings
from app.services.cache_utils import get_cached, set_cached
from app.services.platforms.wikipedia import get_wikipedia_summary
from app.services.search_service import search_all_platforms

logger = logging.getLogger(__name__)

GROQ_MODEL = "llama-3.3-70b-versatile"
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
AI_TIMEOUT_SECONDS = 25.0

_settings = get_settings()
AI_PROVIDER = os.getenv("AI_PROVIDER", _settings.ai_provider or "groq").lower()

groq_client = None
anthropic_client = None

if AI_PROVIDER == "groq" or os.getenv("GROQ_API_KEY") or _settings.groq_api_key.strip():
    try:
        from groq import Groq

        _groq_key = os.getenv("GROQ_API_KEY", _settings.groq_api_key).strip()
        if _groq_key:
            groq_client = Groq(api_key=_groq_key)
            logger.info("Groq AI client initialized (free tier)")
    except Exception as exc:
        logger.error("Groq init failed: %s", exc)

_anthropic_key = os.getenv("ANTHROPIC_API_KEY", _settings.anthropic_api_key).strip()
if _anthropic_key:
    try:
        import anthropic

        anthropic_client = anthropic.Anthropic(api_key=_anthropic_key)
        logger.info("Anthropic Claude client initialized (fallback)")
    except Exception as exc:
        logger.error("Anthropic init failed: %s", exc)

SYSTEM_PROMPT = """You are Pulse AI, an intelligent assistant for OpinionPulse
— a social media public opinion tracking platform.

You have access to real-time data from Reddit, YouTube,
NewsAPI, Guardian, HackerNews, Dev.to, and Wikipedia.

When answering:
- Be specific and data-driven
- Cite real numbers and sources when available
- Give sentiment percentages when relevant
- Keep responses clear and well-structured
- Use bullet points for lists
- Use markdown formatting (bold, bullets)

IMPORTANT: You MUST end every single response with
exactly this format on its own line at the very end:

SUGGESTIONS: ["first suggestion here", "second suggestion here", "third suggestion here"]

Example:
SUGGESTIONS: ["What do people think about Bitcoin?", "Show me AI sentiment trends", "Compare climate change opinions"]

This line is required in every response. Never skip it.
Each suggestion should be a relevant follow-up search the user might explore next.

Tone: Professional but friendly.
Like a smart research assistant who has just
read 100 social media posts for you.

Never say you don't have access to real-time data.
Never make up statistics — only use provided data.
Never mention being Llama or any other model name.
You are Pulse AI, powered by OpinionPulse technology."""


def should_fetch_data(message: str) -> bool:
    message_lower = message.lower()
    data_triggers = [
        "what do people think",
        "opinion on",
        "sentiment",
        "trending",
        "popular",
        "people say",
        "public thinks",
        "what is",
        "tell me about",
        "analyze",
        "thoughts on",
        "how do people feel",
        "reaction to",
        "debate",
        "predict",
        "forecast",
        "trend",
        "search for",
        "find",
        "show me",
        "what about",
        "latest",
        "news about",
        "compare",
        "vs",
        "versus",
        "reddit",
        "youtube",
        "social media",
    ]
    return any(trigger in message_lower for trigger in data_triggers)


def extract_search_query(message: str) -> str:
    prefixes = [
        "what do people think about ",
        "what is the opinion on ",
        "tell me about ",
        "search for ",
        "find information about ",
        "what is the sentiment on ",
        "how do people feel about ",
        "what are people saying about ",
        "latest news on ",
        "show me ",
        "analyze ",
        "what about ",
        "predict where ",
        "compare opinions on ",
    ]

    query = message.strip().rstrip("?!.")
    query_lower = query.lower()

    for prefix in prefixes:
        if query_lower.startswith(prefix):
            query = query[len(prefix) :]
            break

    if " vs " in query.lower() or " versus " in query.lower():
        return query.strip()

    words = query.split()
    if len(words) > 6:
        query = " ".join(words[:6])

    return query.strip() if len(query) > 2 else message[:60]


def extract_comparison_queries(message: str) -> list[str]:
    lower = message.lower()
    for sep in (" vs ", " versus ", " vs. ", " compare ", " compared to "):
        if sep in lower:
            parts = re.split(re.escape(sep.strip()), message, maxsplit=1, flags=re.I)
            if len(parts) == 2:
                left = extract_search_query(parts[0].replace("compare", "").strip())
                right = extract_search_query(parts[1].strip())
                if left and right:
                    return [left, right]
    return []


def extract_suggestions(response_text: str) -> list[str]:
    patterns = [
        r"SUGGESTIONS:\s*\[([^\]]+)\]",
        r"suggestions:\s*\[([^\]]+)\]",
        r"\*\*Suggested searches:\*\*\s*\[([^\]]+)\]",
        r"Suggested searches:\s*\[([^\]]+)\]",
    ]

    for pattern in patterns:
        match = re.search(pattern, response_text, re.IGNORECASE | re.DOTALL)
        if not match:
            continue
        suggestions_str = match.group(1)
        suggestions = re.findall(r'["\']([^"\']+)["\']', suggestions_str)
        if not suggestions:
            suggestions = [
                s.strip().strip("\"'")
                for s in suggestions_str.split(",")
            ]
        result = [s.strip() for s in suggestions if len(s.strip()) > 3][:3]
        if result:
            return result

    return []


def clean_response_text(response: str) -> str:
    return re.sub(
        r"\n?SUGGESTIONS:\s*\[[^\]]+\]",
        "",
        response,
        flags=re.IGNORECASE,
    ).strip()


def _sentiment_summary(results: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(results)
    if total == 0:
        return {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
    positive = len([r for r in results if r.get("sentiment") == "positive"])
    negative = len([r for r in results if r.get("sentiment") == "negative"])
    neutral = total - positive - negative
    return {
        "positive": round((positive / total) * 100),
        "negative": round((negative / total) * 100),
        "neutral": round((neutral / total) * 100),
        "total": total,
    }


def _build_context_data(
    search_query: str,
    fetched_results: list[dict[str, Any]],
    sentiment_summary: dict[str, Any],
    wiki_summary: dict | None,
) -> str:
    if not fetched_results:
        return ""

    top_results = fetched_results[:15]
    context_lines = []
    for r in top_results:
        engagement = r.get("engagement") or {}
        likes = engagement.get("likes", 0) if isinstance(engagement, dict) else 0
        context_lines.append(
            f"[{r.get('platform', '').upper()}] "
            f"{r.get('author', 'Unknown')} — "
            f"{r.get('title', '')}: "
            f"{str(r.get('content', ''))[:150]} "
            f"(sentiment: {r.get('sentiment', 'neutral')}, likes: {likes})"
        )

    wiki_text = "Not available"
    if wiki_summary and isinstance(wiki_summary, dict):
        wiki_text = str(wiki_summary.get("summary", ""))[:300]

    return f"""
REAL-TIME DATA FETCHED FOR "{search_query}":
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total results: {len(fetched_results)} posts/articles
Time range: Last 7 days

SENTIMENT BREAKDOWN:
  Positive: {sentiment_summary.get('positive', 0)}%
  Negative: {sentiment_summary.get('negative', 0)}%
  Neutral:  {sentiment_summary.get('neutral', 0)}%

TOP POSTS & ARTICLES:
{chr(10).join(context_lines)}

WIKIPEDIA CONTEXT:
{wiki_text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use this real data to give a specific, accurate answer.
"""


def _call_groq(messages: list[dict[str, str]], system_prompt: str) -> str:
    if groq_client is None:
        raise RuntimeError("GROQ_API_KEY not configured")
    formatted_messages = [{"role": "system", "content": system_prompt}] + messages
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=formatted_messages,
        max_tokens=1024,
        temperature=0.7,
        stream=False,
    )
    return response.choices[0].message.content or ""


def _call_anthropic(messages: list[dict[str, str]], system_prompt: str) -> str:
    if anthropic_client is None:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")
    response = anthropic_client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


async def call_ai_provider(
    messages: list[dict[str, str]],
    system_prompt: str,
) -> str:
    """Call Groq first, fall back to Anthropic if available."""

    if groq_client:
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(_call_groq, messages, system_prompt),
                timeout=AI_TIMEOUT_SECONDS,
            )
            logger.info("Groq response received")
            return result
        except Exception as exc:
            logger.error("Groq API error: %s", exc)

    if anthropic_client:
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(_call_anthropic, messages, system_prompt),
                timeout=AI_TIMEOUT_SECONDS,
            )
            logger.info("Anthropic fallback response received")
            return result
        except Exception as exc:
            logger.error("Anthropic fallback error: %s", exc)

    raise RuntimeError(
        "No AI provider configured. Add GROQ_API_KEY to .env.local"
    )


async def process_chat_message(
    message: str,
    conversation_history: list[dict[str, str]],
    user_id: int | None = None,
) -> dict[str, Any]:
    del user_id

    context_data = ""
    fetched_results: list[dict[str, Any]] = []
    sentiment_summary: dict[str, Any] = {}
    wiki_summary: dict | None = None
    search_query: str | None = None

    if should_fetch_data(message):
        compare_queries = extract_comparison_queries(message)
        queries = compare_queries or (
            [extract_search_query(message)] if extract_search_query(message) else []
        )

        if queries:
            search_query = " vs ".join(queries) if len(queries) > 1 else queries[0]
            logger.info("Pulse AI fetching data for: %s", search_query)

            blocks: list[str] = []
            for q in queries:
                cache_key = f"chat_data_{q.lower().replace(' ', '_')}"
                cached = get_cached(cache_key)

                if cached:
                    logger.info("Cache hit for: %s", q)
                    results = cached.get("results", [])
                    sentiment = cached.get("sentiment", {})
                    wiki = cached.get("wiki")
                else:
                    results = []
                    sentiment = {}
                    wiki = None
                    try:
                        results = await search_all_platforms(q, "7d")
                        sentiment = _sentiment_summary(results)
                        try:
                            wiki = await asyncio.to_thread(get_wikipedia_summary, q)
                        except Exception as wiki_err:
                            logger.debug("Wikipedia skip: %s", wiki_err)

                        set_cached(
                            cache_key,
                            {
                                "results": results,
                                "sentiment": sentiment,
                                "wiki": wiki,
                            },
                            duration=300,
                        )
                        logger.info(
                            "Fetched %s results for '%s'",
                            len(results),
                            q,
                        )
                    except Exception as fetch_err:
                        logger.error("Data fetch failed: %s", fetch_err)

                fetched_results.extend(results)
                if wiki and not wiki_summary:
                    wiki_summary = wiki
                if results:
                    blocks.append(_build_context_data(q, results, sentiment, wiki))

            sentiment_summary = _sentiment_summary(fetched_results)
            context_data = "\n".join(blocks)

    messages_for_ai: list[dict[str, str]] = []
    for msg in conversation_history[-8:]:
        if msg.get("role") in ("user", "assistant"):
            messages_for_ai.append(
                {"role": msg["role"], "content": str(msg["content"])[:800]}
            )

    current_content = message
    if context_data:
        current_content = f"{context_data}\n\nUser's question: {message}"

    messages_for_ai.append({"role": "user", "content": current_content})

    try:
        ai_response = await call_ai_provider(messages_for_ai, SYSTEM_PROMPT)
        suggestions = extract_suggestions(ai_response)
        clean_response = clean_response_text(ai_response)

        return {
            "message": clean_response,
            "suggestions": suggestions,
            "data_used": {
                "query": search_query,
                "results_count": len(fetched_results),
                "sentiment": sentiment_summary,
                "platforms": list(
                    {
                        r.get("platform", "")
                        for r in fetched_results
                        if r.get("platform")
                    }
                ),
            },
            "wiki_summary": wiki_summary,
            "has_real_data": len(fetched_results) > 0,
        }
    except Exception as ai_error:
        logger.error("AI provider error: %s", ai_error)
        error_msg = str(ai_error)

        if "GROQ_API_KEY" in error_msg or "No AI provider" in error_msg:
            friendly_msg = (
                "Pulse AI needs an API key to respond.\n\n"
                "Add `GROQ_API_KEY` to your backend `.env.local` "
                "file.\n\nGet a free key at: console.groq.com"
            )
        elif "rate_limit" in error_msg.lower():
            friendly_msg = (
                "Too many requests. Please wait a moment and try again."
            )
        elif "invalid_api_key" in error_msg.lower():
            friendly_msg = (
                "Invalid API key. Please check your GROQ_API_KEY in .env.local"
            )
        else:
            friendly_msg = (
                "I encountered an issue processing your request. "
                "Please try again in a moment."
            )

        return {
            "message": friendly_msg,
            "suggestions": [],
            "data_used": {
                "query": search_query,
                "results_count": len(fetched_results),
                "sentiment": sentiment_summary,
                "platforms": [],
            },
            "wiki_summary": wiki_summary,
            "has_real_data": len(fetched_results) > 0,
            "error": error_msg,
        }
