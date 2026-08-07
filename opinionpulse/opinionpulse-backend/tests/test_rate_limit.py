"""Tests for upstream rate-limit cooldown tracking."""

from __future__ import annotations

from app.services import platform_rate_limit as prl


def test_mark_and_check_rate_limit():
    prl._cooldown_until.clear()
    assert prl.is_rate_limited("reddit") is False
    prl.mark_rate_limited("reddit", 60)
    assert prl.is_rate_limited("reddit") is True
    assert prl.remaining_seconds("reddit") > 0


def test_query_processor_technical_intent():
    from app.services.query_processor import QueryProcessor

    proc = QueryProcessor()
    assert proc.process("react")["intent"] == "technical"
    assert proc.process("angular")["intent"] == "technical"
    assert "programming" in proc.process("react")["platform_queries"]["reddit"]
