"""Hermetic API tests (SQLite + TestClient, no live network)."""
from __future__ import annotations

import re

from app.core.security import hash_password
from app.db.models import User, UsageTracking
from app.services.notification_service import create_user_notification


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


def _signup_token(client, email, pw="Str0ng!Pass"):
    r = client.post(
        "/api/auth/signup",
        json={"full_name": "Test User", "email": email, "password": pw},
    )
    assert r.status_code in (200, 201), r.text
    otp = _find(r.json(), "dev_otp_code")
    if isinstance(otp, dict):
        otp = otp.get("code") or next((v for v in otp.values() if isinstance(v, str)), None)
    if not otp:
        m = re.search(r"\b\d{6}\b", r.text)
        otp = m.group(0) if m else None
    r2 = client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": otp, "type": "signup"},
    )
    assert r2.status_code == 200, r2.text
    return _find(r2.json(), "access_token")


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_me_without_token_is_401(client):
    assert client.get("/api/auth/me").status_code == 401


def test_resend_otp_unknown_email_is_generic(client):
    # C2: unknown email must NOT 404 (no account enumeration).
    r = client.post(
        "/api/auth/resend-otp", json={"email": "nobody@example.com", "type": "signup"}
    )
    assert r.status_code == 200, r.text


def test_search_402_when_at_cap(client, db):
    token = _signup_token(client, "cap@example.com")
    user = db.query(User).filter(User.email == "cap@example.com").first()
    from app.services.plan_service import get_or_create_usage

    usage = get_or_create_usage(user.id, db)
    row = db.get(UsageTracking, usage["id"])
    row.searches_used = 100  # Starter monthly cap; limit check runs before any fetch
    db.commit()
    r = client.post(
        "/api/search", json={"query": "climate", "time_range": "7d"}, headers=_auth(token)
    )
    assert r.status_code == 402, r.text


def test_username_taken_returns_400(client, db):
    # C6: uniqueness collision returns a clean 400, not a 500.
    taken = User(
        name="Owner",
        email="owner@example.com",
        password_hash=hash_password("Str0ng!Pass"),
        role="user",
        is_active=True,
        is_email_verified=True,
        username="takenname",
        plan_id="starter",
    )
    db.add(taken)
    db.commit()
    token = _signup_token(client, "other@example.com")
    r = client.put(
        "/api/account/profile", json={"username": "takenname"}, headers=_auth(token)
    )
    assert r.status_code == 400, r.text


def test_notification_ownership_enforced(client, db):
    stranger = User(
        name="Stranger",
        email="stranger@example.com",
        password_hash=hash_password("Str0ng!Pass"),
        role="user",
        is_active=True,
        is_email_verified=True,
        plan_id="starter",
    )
    db.add(stranger)
    db.commit()
    db.refresh(stranger)
    notif = create_user_notification(
        db, user_id=stranger.id, type="info", title="T", message="M"
    )
    db.commit()
    db.refresh(notif)
    token = _signup_token(client, "notme@example.com")
    r = client.patch(f"/api/notifications/{notif.id}/read", headers=_auth(token))
    assert r.status_code in (403, 404), r.text


def test_starter_cannot_create_alert(client):
    # Starter realtime_alerts_max == 0 -> create is gated with 402.
    token = _signup_token(client, "starter-alert@example.com")
    r = client.post(
        "/api/personal-alerts",
        json={"keyword": "brandx", "threshold": 70, "frequency": "daily"},
        headers=_auth(token),
    )
    assert r.status_code == 402, r.text


def test_alert_reenable_respects_limit(client, db):
    # E2: re-enabling a paused alert must count against the active limit.
    token = _signup_token(client, "pro@example.com")
    user = db.query(User).filter(User.email == "pro@example.com").first()
    user.plan_id = "pro"  # realtime_alerts_max == 5
    db.commit()

    ids = []
    for i in range(5):
        r = client.post(
            "/api/personal-alerts",
            json={"keyword": f"kw{i}", "threshold": 70, "frequency": "daily"},
            headers=_auth(token),
        )
        assert r.status_code == 201, r.text
        ids.append(r.json()["id"])

    # pause one -> 4 active
    assert client.patch(
        f"/api/personal-alerts/{ids[0]}", json={"enabled": False}, headers=_auth(token)
    ).status_code == 200
    # create a 6th (4 < 5, allowed) -> 5 active
    r6 = client.post(
        "/api/personal-alerts",
        json={"keyword": "kw6", "threshold": 70, "frequency": "daily"},
        headers=_auth(token),
    )
    assert r6.status_code == 201, r6.text
    # re-enabling the paused one would be a 6th active -> must 402 (the bug)
    r_reenable = client.patch(
        f"/api/personal-alerts/{ids[0]}", json={"enabled": True}, headers=_auth(token)
    )
    assert r_reenable.status_code == 402, r_reenable.text
