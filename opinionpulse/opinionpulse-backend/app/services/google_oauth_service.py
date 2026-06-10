"""Google OAuth 2.0 authorization code flow."""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import requests

from app.core.config import get_settings
from app.core.security import create_access_token, decode_access_token, hash_password

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@dataclass(frozen=True)
class GoogleUserInfo:
    google_id: str
    email: str
    name: str
    avatar_url: str | None
    email_verified: bool


def is_google_oauth_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.google_client_id.strip() and settings.google_client_secret.strip()
    )


def google_redirect_uri() -> str:
    settings = get_settings()
    configured = settings.google_redirect_uri.strip()
    if configured:
        return configured
    return "http://127.0.0.1:8000/api/auth/google/callback"


def create_oauth_state(redirect_path: str) -> str:
    safe_redirect = redirect_path if redirect_path.startswith("/") else "/dashboard"
    return create_access_token(
        {"oauth_state": True, "redirect": safe_redirect},
        expires_minutes=10,
    )


def parse_oauth_state(state: str) -> str:
    payload = decode_access_token(state)
    if payload is None or not payload.get("oauth_state"):
        raise ValueError("Invalid OAuth state")
    redirect = payload.get("redirect") or "/dashboard"
    return redirect if str(redirect).startswith("/") else "/dashboard"


def build_authorization_url(redirect_path: str = "/dashboard") -> str:
    settings = get_settings()
    state = create_oauth_state(redirect_path)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_user(code: str) -> GoogleUserInfo:
    settings = get_settings()
    token_response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": google_redirect_uri(),
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if not token_response.ok:
        detail = token_response.text[:200]
        raise ValueError(f"Google token exchange failed: {detail}")

    token_data: dict[str, Any] = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise ValueError("Google did not return an access token")

    user_response = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if not user_response.ok:
        raise ValueError("Failed to fetch Google user profile")

    profile: dict[str, Any] = user_response.json()
    google_id = str(profile.get("sub") or "").strip()
    email = str(profile.get("email") or "").strip().lower()
    if not google_id or not email:
        raise ValueError("Google profile is missing required fields")

    return GoogleUserInfo(
        google_id=google_id,
        email=email,
        name=str(profile.get("name") or email.split("@")[0]).strip(),
        avatar_url=profile.get("picture"),
        email_verified=bool(profile.get("email_verified")),
    )


def oauth_password_placeholder() -> str:
    """Random bcrypt hash so OAuth-only users cannot sign in with a password."""
    return hash_password(secrets.token_urlsafe(48))
