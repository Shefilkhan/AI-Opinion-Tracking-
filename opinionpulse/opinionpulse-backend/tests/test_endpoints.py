"""Hermetic endpoint smoke tests (SQLite + TestClient, externals mocked)."""
from __future__ import annotations

import re
from datetime import date

from app.db.models import User, UsageTracking


def _find(node, key):
    if isinstance(node, dict):
        if node.get(key):
            return node[key]
        for value in node.values():
            found = _find(value, key)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find(item, key)
            if found:
                return found
    return None


def _token(client, email):
    r = client.post(
        "/api/auth/signup",
        json={"full_name": "Test User", "email": email, "password": "Str0ng!Pass"},
    )
    assert r.status_code in (200, 201), r.text
    otp = _find(r.json(), "dev_otp_code")
    if isinstance(otp, dict):
        otp = otp.get("code") or next((v for v in otp.values() if isinstance(v, str)), None)
    if not otp:
        m = re.search(r"\b\d{6}\b", r.text)
        otp = m.group(0) if m else None
    r2 = client.post(
        "/api/auth/verify-otp", json={"email": email, "otp_code": otp, "type": "signup"}
    )
    assert r2.status_code == 200, r2.text
    return {"Authorization": f"Bearer {_find(r2.json(), 'access_token')}"}


def test_crisis_radar_ok(client):
    auth = _token(client, "radar@example.com")
    r = client.get("/api/crisis/radar", headers=auth)
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body["points"], list)
    assert "legend" in body


def test_chat_402_starter_no_pulse_ai(client):
    auth = _token(client, "chatcap@example.com")
    r = client.post("/api/chat/message", json={"message": "hi there"}, headers=auth)
    assert r.status_code == 402, r.text
    detail = r.json()["detail"]
    assert detail["error"] == "limit_exceeded"
    assert "Pulse AI" in detail["message"]


def test_chat_402_at_daily_cap(client, db):
    auth = _token(client, "chatcap@example.com")
    user = db.query(User).filter(User.email == "chatcap@example.com").first()
    user.plan_id = "pro"
    db.commit()
    from app.services.plan_service import get_or_create_usage

    usage = get_or_create_usage(user.id, db)
    row = db.get(UsageTracking, usage["id"])
    row.chat_messages_used_today = 100  # Pro daily cap
    row.chat_messages_today_date = date.today()
    db.commit()
    r = client.post("/api/chat/message", json={"message": "hi there"}, headers=auth)
    assert r.status_code == 402, r.text


def test_ai_status_reflects_no_key(client):
    auth = _token(client, "aistatus@example.com")
    r = client.get("/api/ai/status", headers=auth)
    assert r.status_code == 200, r.text
    assert r.json()["enabled"] is False  # no ANTHROPIC_API_KEY in this env


def test_notifications_list_ok(client):
    auth = _token(client, "notif@example.com")
    r = client.get("/api/notifications?limit=20", headers=auth)
    assert r.status_code == 200, r.text
    assert isinstance(r.json()["items"], list)


def test_account_usage_ok(client):
    auth = _token(client, "usage@example.com")
    r = client.get("/api/account/usage", headers=auth)
    assert r.status_code == 200, r.text
    assert "usage" in r.json()


def test_settings_status_ok(client):
    auth = _token(client, "settings@example.com")
    r = client.get("/api/settings/status", headers=auth)
    assert r.status_code == 200, r.text


def test_dashboard_overview_ok_with_mocked_fetchers(client, monkeypatch):
    from app.services import dashboard_live_service as dls

    async def _no_gather():
        return [], [], []

    async def _no_collect():
        return None

    monkeypatch.setattr(dls, "_gather_trending", _no_gather)
    monkeypatch.setattr(dls, "collect_trending_snapshots", _no_collect)

    auth = _token(client, "dash@example.com")
    r = client.get("/api/dashboard/overview", headers=auth)
    assert r.status_code == 200, r.text
    assert "stats" in r.json()
