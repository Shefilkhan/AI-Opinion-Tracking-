"""DB-backed service tests on in-memory SQLite."""
from __future__ import annotations

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.security import hash_password
from app.db.models import User, UsageTracking
from app.schemas.account import AccountPasswordUpdate
from app.services.session_service import (
    create_user_session,
    is_session_valid,
    revoke_all_user_sessions,
    revoke_token_session,
)


def _make_user(db, email="t@example.com"):
    user = User(
        name="Test User",
        email=email,
        password_hash=hash_password("Str0ng!Pass"),
        role="user",
        is_active=True,
        is_email_verified=True,
        plan_id="starter",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_logout_revokes_session(db):
    """C1 regression: after revoke, the token must NOT validate."""
    user = _make_user(db)
    token = create_user_session(db, user)
    assert is_session_valid(db, token) is True
    revoke_token_session(db, token)
    assert is_session_valid(db, token) is False


def test_revoke_all_user_sessions(db):
    user = _make_user(db, email="multi@example.com")
    t1 = create_user_session(db, user)
    t2 = create_user_session(db, user)
    removed = revoke_all_user_sessions(db, user.id)
    assert removed == 2
    assert is_session_valid(db, t1) is False
    assert is_session_valid(db, t2) is False


def test_account_password_schema_rejects_weak():
    with pytest.raises(ValidationError):
        AccountPasswordUpdate(
            current_password="x", new_password="abcdef", confirm_password="abcdef"
        )


def test_account_password_schema_accepts_strong():
    AccountPasswordUpdate(
        current_password="x",
        new_password="Str0ng!Pass",
        confirm_password="Str0ng!Pass",
    )


def test_search_limit_raises_402_at_cap(db):
    from app.services.plan_limits import check_search_limit
    from app.services.plan_service import get_or_create_usage

    user = _make_user(db, email="limit@example.com")
    usage = get_or_create_usage(user.id, db)
    row = db.get(UsageTracking, usage["id"])
    row.searches_used = 100  # Starter cap
    db.commit()
    with pytest.raises(HTTPException) as exc:
        check_search_limit(user.id, db)
    assert exc.value.status_code == 402
