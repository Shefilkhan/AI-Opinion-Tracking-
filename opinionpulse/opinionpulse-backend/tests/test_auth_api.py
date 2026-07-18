"""End-to-end auth flow via FastAPI TestClient on SQLite (no MySQL needed)."""
from __future__ import annotations

import re


def _find(node, key):
    """Recursively find a truthy value for `key` anywhere in a JSON structure."""
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


def _extract_otp(response) -> str | None:
    val = _find(response.json(), "dev_otp_code")
    if isinstance(val, dict):
        val = val.get("code") or val.get("otp") or next(
            (v for v in val.values() if isinstance(v, str)), None
        )
    if isinstance(val, str) and val:
        return val
    m = re.search(r"\b\d{6}\b", response.text)
    return m.group(0) if m else None


def test_full_auth_flow_and_logout_revocation(client):
    email = "apitester@example.com"
    r = client.post(
        "/api/auth/signup",
        json={"full_name": "Api Tester", "email": email, "password": "Str0ng!Pass"},
    )
    assert r.status_code in (200, 201), r.text
    otp = _extract_otp(r)
    assert otp, f"no dev OTP in signup response: {r.text}"

    r2 = client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": otp, "type": "signup"},
    )
    assert r2.status_code == 200, r2.text
    token = _find(r2.json(), "access_token")
    assert token, f"no access_token in verify response: {r2.text}"

    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200, me.text

    logout = client.post("/api/auth/logout", headers=headers)
    assert logout.status_code == 200, logout.text

    # C1 end-to-end: the revoked token must no longer authenticate.
    me_after = client.get("/api/auth/me", headers=headers)
    assert me_after.status_code == 401, me_after.text


def test_weak_password_signup_rejected(client):
    r = client.post(
        "/api/auth/signup",
        json={"full_name": "Weak Pass", "email": "weak@example.com", "password": "weak"},
    )
    assert r.status_code == 422, r.text


def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
