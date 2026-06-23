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

_groq_client: Any = None
_groq_client_key: str | None = None
_anthropic_client: Any = None
_anthropic_client_key: str | None = None


def get_groq_client():
    """Lazy Groq client — reads GROQ_API_KEY at call time (not import time)."""
    global _groq_client, _groq_client_key
    settings = get_settings()
    key = os.getenv("GROQ_API_KEY", settings.groq_api_key).strip()
    if not key:
        _groq_client = None
        _groq_client_key = None
        return None
    if _groq_client is None or _groq_client_key != key:
        try:
            from groq import Groq

            _groq_client = Groq(api_key=key)
            _groq_client_key = key
            logger.info("Groq AI client initialized")
        except Exception as exc:
            logger.error("Groq init failed: %s", exc)
            _groq_client = None
            _groq_client_key = None
    return _groq_client


def get_anthropic_client():
    """Lazy Anthropic client for fallback."""
    global _anthropic_client, _anthropic_client_key
    settings = get_settings()
    key = os.getenv("ANTHROPIC_API_KEY", settings.anthropic_api_key).strip()
    if not key:
        _anthropic_client = None
        _anthropic_client_key = None
        return None
    if _anthropic_client is None or _anthropic_client_key != key:
        try:
            import anthropic

            _anthropic_client = anthropic.Anthropic(api_key=key)
            _anthropic_client_key = key
            logger.info("Anthropic Claude client initialized (fallback)")
        except Exception as exc:
            logger.error("Anthropic init failed: %s", exc)
            _anthropic_client = None
            _anthropic_client_key = None
    return _anthropic_client

SYSTEM_PROMPT = """You are Pulse AI for OpinionPulse — public opinion research from live social & news data.

STRICT RESPONSE RULES:
1. Line 1 = direct answer to the user's exact question (max 18 words).
2. Full reply max 100 words (150 only for compare A vs B questions).
3. Use short bullets (- ) — max 5 bullets, max 10 words each.
4. Lead with numbers from provided data (% sentiment, post counts, platforms).
5. No greetings, intros, conclusions, or filler paragraphs.
6. Do not repeat the question or explain what you are doing.
7. Only include info the user asked for — skip unrelated context.

FORMAT BY QUESTION TYPE:
- Sentiment: **Sentiment:** X% pos · Y% neg · Z% neutral → 2–3 bullets
- Compare: **A:** … / **B:** … with 2 bullets each side
- Trend/predict: **Direction:** … → 2 bullets max
- "What is X": 1-line definition + 2 opinion bullets from data

Use **bold** labels only. No long prose blocks.

End every response with exactly (own line, last line):
SUGGESTIONS: ["follow-up 1", "follow-up 2", "follow-up 3"]

Never invent stats. Never mention Llama/Groq/model names. You are Pulse AI.

IMPORTANT LIMITS:
- You do NOT have live sports scores, weather, or stock prices.
- For score/result questions: only state a score if a provided post explicitly mentions it.
- If no score in the data, line 1 must say the score is not in the fetched posts.
- Never infer a winner or score from sentiment percentages.
- Use **A:** / **B:** ONLY when the user compares two topics for opinion (e.g. React vs Angular)."""


FACTUAL_LOOKUP = re.compile(
    r"\b("
    r"score|scores|result|lineup|who won|final score|match result|"
    r"live score|runs|wickets|goals|points|standings|"
    r"weather|stock price|exchange rate|price of"
    r")\b",
    re.I,
)

SPORTS_CONTEXT = re.compile(
    r"\b("
    r"odi|t20|test match|ipl|cricket|football|soccer|nba|nfl|"
    r"world cup|semifinal|quarterfinal|innings|super bowl|"
    r"afg|ind vs|match\b|fixture|tournament"
    r")\b",
    re.I,
)

COMPARE_INTENT = re.compile(
    r"\b("
    r"compare|opinion|sentiment|think about|feel about|"
    r"which is better|debate|prefer|public opinion|"
    r"compare opinions|head to head|head-to-head"
    r")\b",
    re.I,
)


def classify_question(message: str) -> str:
    """Return: factual | compare | sentiment | trend | general."""
    lower = message.lower()
    if FACTUAL_LOOKUP.search(message) or (
        SPORTS_CONTEXT.search(message) and re.search(r"\bvs\.?\b", lower)
    ):
        return "factual"
    if is_opinion_compare_query(message):
        return "compare"
    if any(x in lower for x in ("predict", "forecast", "trend", "heading")):
        return "trend"
    if any(
        x in lower
        for x in ("sentiment", "think", "feel", "opinion", "say", "reaction")
    ):
        return "sentiment"
    return "general"


def is_opinion_compare_query(message: str) -> bool:
    """True only when user wants an A-vs-B opinion comparison, not sports scores."""
    lower = message.lower()
    has_vs = bool(re.search(r"\bvs\.?\b", lower)) or " versus " in lower
    has_compare = "compare" in lower or "compared to" in lower
    if not has_vs and not has_compare:
        return False

    if FACTUAL_LOOKUP.search(message):
        return False
    if SPORTS_CONTEXT.search(message):
        return False

    if has_compare or COMPARE_INTENT.search(message):
        return True

    # "React vs Angular" style — both sides short, no sports/factual markers
    for sep in (" vs ", " versus ", " vs. "):
        if sep in lower:
            left, _, right = lower.partition(sep.strip())
            right = right.strip()
            if FACTUAL_LOOKUP.search(right) or SPORTS_CONTEXT.search(right):
                return False
            if re.search(r"\d", right):
                return False
            if len(right.split()) > 4:
                return False
            if len(left.split()) > 4:
                return False
            return True

    return False


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
    if not is_opinion_compare_query(message):
        return []

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


def _response_format_hint(message: str) -> str:
    kind = classify_question(message)
    if kind == "factual":
        return (
            "Reply format: Line 1 = whether the score/result appears in the posts "
            "(if not, say 'Score not found in fetched posts — I track opinion, not live scores'). "
            "Then up to 3 bullets quoting what posts say about the match. "
            "Do NOT use **A:**/**B:** labels. Do NOT invent scores or winners."
        )
    if kind == "compare":
        return "Reply format: 1-line verdict, then **A:** and **B:** with 2 bullets each (max 150 words)."
    if kind == "trend":
        return "Reply format: **Direction:** one phrase, then 2 trend bullets with data."
    if kind == "sentiment":
        return "Reply format: **Sentiment:** X% pos · Y% neg · Z% neutral, then 2–3 short bullets."
    return "Reply format: 1-line direct answer, then up to 4 short bullets. Max 100 words."


def _trim_response_body(text: str, max_chars: int = 650) -> str:
    """Safety net if the model still returns a wall of text."""
    cleaned = re.sub(r"\n{3,}", "\n\n", text.strip())
    if len(cleaned) <= max_chars:
        return cleaned
    cut = cleaned[:max_chars]
    for sep in ("\n- ", "\n**", ". ", ".\n"):
        idx = cut.rfind(sep)
        if idx > max_chars * 0.45:
            return cut[: idx + len(sep.rstrip())].strip()
    return cut.strip() + "…"


def clean_response_text(response: str) -> str:
    body = re.sub(
        r"\n?SUGGESTIONS:\s*\[[^\]]+\]",
        "",
        response,
        flags=re.IGNORECASE,
    ).strip()
    return _trim_response_body(body)


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


def _score_snippets_from_results(results: list[dict[str, Any]]) -> str:
    """Pull lines that may contain an actual score/result from fetched posts."""
    score_re = re.compile(
        r"(\d{1,3}\s*[-/]\s*\d{1,3}|\d+\s*/\s*\d+|won by \d+|beat \w+ by \d+"
        r"|\d+\s*runs|\d+\s*goals|final score)",
        re.I,
    )
    lines: list[str] = []
    for r in results[:25]:
        text = f"{r.get('title', '')} {r.get('content', '')}".strip()
        if score_re.search(text):
            lines.append(f"- [{r.get('platform', '?')}] {text[:140]}")
        if len(lines) >= 4:
            break
    if not lines:
        return ""
    return "Possible score/result mentions in posts:\n" + "\n".join(lines)


def _build_context_data(
    search_query: str,
    fetched_results: list[dict[str, Any]],
    sentiment_summary: dict[str, Any],
    wiki_summary: dict | None,
) -> str:
    if not fetched_results:
        return ""

    top_results = fetched_results[:8]
    context_lines = []
    for r in top_results:
        title = str(r.get("title", ""))[:80]
        snippet = str(r.get("content", ""))[:80]
        context_lines.append(
            f"- [{r.get('platform', '?')}] {title} ({r.get('sentiment', 'neutral')})"
            + (f" — {snippet}" if snippet and snippet != title else "")
        )

    wiki_text = ""
    if wiki_summary and isinstance(wiki_summary, dict):
        wiki_text = str(wiki_summary.get("summary", ""))[:120]

    wiki_block = f"\nWiki: {wiki_text}" if wiki_text else ""
    return f"""DATA for "{search_query}" (7d, {len(fetched_results)} posts):
Sentiment: {sentiment_summary.get('positive', 0)}% pos · {sentiment_summary.get('negative', 0)}% neg · {sentiment_summary.get('neutral', 0)}% neutral
Top signals:
{chr(10).join(context_lines)}{wiki_block}
Use only these numbers. Be brief."""


def _call_groq(messages: list[dict[str, str]], system_prompt: str) -> str:
    client = get_groq_client()
    if client is None:
        raise RuntimeError("GROQ_API_KEY not configured")
    formatted_messages = [{"role": "system", "content": system_prompt}] + messages
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=formatted_messages,
        max_tokens=400,
        temperature=0.35,
        stream=False,
    )
    return response.choices[0].message.content or ""


def _call_anthropic(messages: list[dict[str, str]], system_prompt: str) -> str:
    client = get_anthropic_client()
    if client is None:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")
    response = client.messages.create(
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

    if get_groq_client():
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(_call_groq, messages, system_prompt),
                timeout=AI_TIMEOUT_SECONDS,
            )
            logger.info("Groq response received")
            return result
        except Exception as exc:
            logger.error("Groq API error: %s", exc)

    if get_anthropic_client():
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
        "No AI provider configured. Add GROQ_API_KEY to backend .env"
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
            if classify_question(message) == "factual":
                snippets = _score_snippets_from_results(fetched_results)
                if snippets:
                    context_data += f"\n\n{snippets}"

    messages_for_ai: list[dict[str, str]] = []
    for msg in conversation_history[-8:]:
        if msg.get("role") in ("user", "assistant"):
            messages_for_ai.append(
                {"role": msg["role"], "content": str(msg["content"])[:800]}
            )

    format_hint = _response_format_hint(message)
    current_content = f"{format_hint}\n\nQuestion: {message}"
    if context_data:
        current_content = f"{context_data}\n\n{format_hint}\n\nQuestion: {message}"

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
                "Add `GROQ_API_KEY` to your backend `.env` file, "
                "then restart the server.\n\nGet a free key at: console.groq.com"
            )
        elif "rate_limit" in error_msg.lower():
            friendly_msg = (
                "Too many requests. Please wait a moment and try again."
            )
        elif "invalid_api_key" in error_msg.lower():
            friendly_msg = (
                "Invalid API key. Please check your GROQ_API_KEY in .env"
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
