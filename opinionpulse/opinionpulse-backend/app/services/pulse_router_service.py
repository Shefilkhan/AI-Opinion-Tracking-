"""Query router — decides which tools and retrieval paths Pulse AI should use."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

CURRENT_WEB_PATTERNS = re.compile(
    r"\b(today|yesterday|this week|right now|latest|just happened|what happened|"
    r"breaking|current|now|score|won the game|election results)\b",
    re.I,
)
OPINION_PATTERNS = re.compile(
    r"\b(sentiment|opinion|people think|people say|public think|reaction|"
    r"feel about|complaints|negative about|positive about|what do people|"
    r"social media|reddit|youtube|mentions|discussion)\b",
    re.I,
)
CRISIS_PATTERNS = re.compile(
    r"\b(crisis|reputation risk|pr crisis|backlash|scandal|controversy)\b",
    re.I,
)
COMPARE_PATTERNS = re.compile(r"\b(compare|versus|vs\.?| vs )\b", re.I)
X_PATTERNS = re.compile(r"\b(on x|on twitter|tweet|tweets|x\.com)\b", re.I)
GENERAL_KNOWLEDGE = re.compile(
    r"^(what is|define|explain|how does|how do|who invented|what are)\b",
    re.I,
)


@dataclass
class RouterDecision:
    intent: str
    requires_opinionpulse: bool = False
    requires_current_web: bool = False
    requires_x: bool = False
    requires_history: bool = False
    requires_comparison: bool = False
    deep_research: bool = False
    live_sources: bool = True
    query: str = ""
    comparison_queries: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)
    reasoning: str = ""


def _extract_query(message: str) -> str:
    from app.services.chat_service import extract_search_query

    return extract_search_query(message) or message.strip()[:80]


def _extract_compare(message: str) -> list[str]:
    from app.services.chat_service import extract_comparison_queries

    return extract_comparison_queries(message)


def route_pulse_query(
    message: str,
    *,
    live_sources: bool = True,
    deep_mode: bool = False,
    conversation_history: list[dict[str, Any]] | None = None,
) -> RouterDecision:
    """Deterministic router — fast, no extra LLM call."""
    msg = message.strip()
    lower = msg.lower()
    query = _extract_query(msg)
    compare = _extract_compare(msg)

    decision = RouterDecision(
        intent="general",
        query=query,
        live_sources=live_sources,
        deep_research=deep_mode,
        comparison_queries=compare,
    )

    if compare or COMPARE_PATTERNS.search(msg):
        decision.intent = "comparison"
        decision.requires_comparison = True
        decision.requires_opinionpulse = live_sources
        decision.tools = ["compare_topics", "search_opinionpulse"]
        decision.reasoning = "Comparison query detected"
        return decision

    if CRISIS_PATTERNS.search(msg):
        decision.intent = "crisis_analysis"
        decision.requires_opinionpulse = live_sources
        decision.tools = ["search_opinionpulse", "get_topic_intelligence"]
        decision.reasoning = "Crisis/reputation language detected"
        return decision

    if OPINION_PATTERNS.search(msg) or any(
        t in lower
        for t in (
            "tell me about",
            "analyze",
            "thoughts on",
            "what about",
            "why is",
            "why are",
        )
    ):
        decision.intent = "opinion_analysis"
        decision.requires_opinionpulse = live_sources
        decision.tools = ["search_opinionpulse", "get_topic_intelligence"]
        decision.reasoning = "Opinion/sentiment analysis requested"
        if CURRENT_WEB_PATTERNS.search(msg):
            decision.requires_current_web = True
            decision.tools.append("search_web")
        if X_PATTERNS.search(msg):
            decision.requires_x = True
            decision.tools.append("search_x")
        if deep_mode:
            decision.requires_current_web = True
            if "search_web" not in decision.tools:
                decision.tools.append("search_web")
        return decision

    if CURRENT_WEB_PATTERNS.search(msg):
        decision.intent = "current_web"
        decision.requires_current_web = True
        decision.requires_opinionpulse = live_sources and not GENERAL_KNOWLEDGE.match(msg)
        decision.tools = ["search_web"]
        if decision.requires_opinionpulse:
            decision.tools.append("search_opinionpulse")
        decision.reasoning = "Current-events question"
        return decision

    if GENERAL_KNOWLEDGE.match(msg) and not live_sources:
        decision.intent = "general_knowledge"
        decision.tools = []
        decision.reasoning = "General knowledge, live sources off"
        return decision

    if live_sources:
        decision.intent = "opinion_analysis"
        decision.requires_opinionpulse = True
        decision.tools = ["search_opinionpulse"]
        if deep_mode:
            decision.tools.append("get_topic_intelligence")
        decision.reasoning = "Default: fetch OpinionPulse when live sources enabled"
    else:
        decision.intent = "general_knowledge"
        decision.tools = []
        decision.reasoning = "Live sources disabled — model knowledge only"

    if deep_mode and "search_web" not in decision.tools:
        decision.requires_current_web = True
        decision.tools.append("search_web")

    if X_PATTERNS.search(msg):
        decision.requires_x = True
        decision.tools.append("search_x")

    return decision
