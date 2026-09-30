"""Tests for Pulse AI query router."""

from app.services.pulse_router_service import route_pulse_query


def test_router_opinion_analysis():
    decision = route_pulse_query(
        "Why are people negative about Samsung Galaxy?",
        live_sources=True,
    )
    assert decision.intent == "opinion_analysis"
    assert decision.requires_opinionpulse is True
    assert "search_opinionpulse" in decision.tools


def test_router_comparison():
    decision = route_pulse_query(
        "Compare Samsung vs iPhone sentiment",
        live_sources=True,
    )
    assert decision.intent == "comparison"
    assert decision.requires_comparison is True
    assert "compare_topics" in decision.tools


def test_router_deep_adds_web():
    decision = route_pulse_query(
        "Tell me about Bitcoin",
        live_sources=True,
        deep_mode=True,
    )
    assert decision.deep_research is True
    assert "search_web" in decision.tools


def test_router_live_sources_off():
    decision = route_pulse_query(
        "What is recursion?",
        live_sources=False,
    )
    assert decision.requires_opinionpulse is False
    assert decision.tools == []
