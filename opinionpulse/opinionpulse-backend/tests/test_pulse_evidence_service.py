"""Tests for Pulse AI evidence bundle."""

from app.services.pulse_evidence_service import (
    build_evidence_bundle,
    compute_analysis_confidence,
    tag_mentions,
)


def test_tag_mentions_assigns_ids():
    rows = [
        {"platform": "reddit", "content": "hello world", "sentiment": "positive"},
        {"platform": "youtube", "content_type": "comment", "content": "bad battery", "sentiment": "negative"},
    ]
    tagged = tag_mentions(rows)
    assert tagged[0]["citation_number"] == 1
    assert tagged[0]["evidence_id"]
    assert tagged[1]["evidence_id"].startswith("yt-comment")


def test_confidence_low_with_few_items():
    bundle = build_evidence_bundle(
        question="test",
        router_intent="opinion_analysis",
        search_results=[{"platform": "reddit", "content": "x", "sentiment": "neutral"}],
    )
    conf = compute_analysis_confidence(bundle)
    assert conf["level"] in ("LOW", "MEDIUM", "HIGH")
