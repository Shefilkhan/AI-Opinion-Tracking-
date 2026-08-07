"""Tests for live source health endpoints."""

from __future__ import annotations

from unittest.mock import patch


def test_health_includes_source_summary(client):
    with patch(
        "app.api.routes.health.get_source_health_summary",
        return_value={
            "live": 4,
            "total_configured": 6,
            "any_live": True,
            "rate_limited": ["reddit"],
        },
    ):
        r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["sources_live"] == 4
    assert body["any_source_live"] is True
    assert body["rate_limited_sources"] == ["reddit"]


def test_health_sources_returns_probe_payload(client):
    payload = {
        "checked_at": "2026-01-01T00:00:00Z",
        "query": "technology",
        "configured": {"reddit": True, "devto": True},
        "sources": {
            "reddit": {"status": "ok", "live": True, "count": 3, "latency_ms": 120},
            "devto": {"status": "ok", "live": True, "count": 2, "latency_ms": 90},
        },
        "summary": {"live": 2, "total_configured": 2, "total_probed": 2, "any_live": True},
    }
    with patch("app.api.routes.health.get_source_health", return_value=payload):
        r = client.get("/api/health/sources")
    assert r.status_code == 200
    body = r.json()
    assert body["summary"]["live"] == 2
    assert body["sources"]["reddit"]["live"] is True


def test_health_tokens_returns_audit(client):
    audit = {
        "checked_at": "2026-01-01T00:00:00Z",
        "summary": {
            "working": 3,
            "missing_keys": 2,
            "rate_limited": 1,
            "expired_or_invalid": 1,
            "issues": ["github: token expired or invalid", "reddit: rate-limited"],
        },
        "tokens": [],
    }
    with patch("app.api.routes.health.get_token_audit", return_value=audit):
        r = client.get("/api/health/tokens")
    assert r.status_code == 200
    body = r.json()
    assert body["summary"]["expired_or_invalid"] == 1
