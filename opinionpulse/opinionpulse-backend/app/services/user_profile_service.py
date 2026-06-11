"""Shared profile serialization and stats helpers."""

from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import PulseChatMessage, SavedSearch, SearchHistory, User
from app.schemas.account import AccountProfileResponse, AccountStatsResponse


def validate_username(username: str) -> None:
    u = username.strip()
    if len(u) < 3 or len(u) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3–30 characters",
        )
    if not re.fullmatch(r"[a-zA-Z0-9_]+", u):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username may only contain letters, numbers, and underscores",
        )


def profile_to_response(user: User) -> AccountProfileResponse:
    role = (user.role or "user").upper()
    return AccountProfileResponse(
        id=user.id,
        name=user.name,
        full_name=user.name,
        email=user.email,
        role=role,
        is_email_verified=bool(user.is_email_verified),
        avatar_url=user.avatar_url,
        username=user.username,
        bio=user.bio,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


def get_user_stats(db: Session, user: User) -> AccountStatsResponse:
    total_searches = (
        db.query(SearchHistory).filter(SearchHistory.user_id == user.id).count()
    )
    total_results = (
        db.query(func.coalesce(func.sum(SearchHistory.results_count), 0))
        .filter(SearchHistory.user_id == user.id)
        .scalar()
        or 0
    )
    saved_searches = (
        db.query(SavedSearch).filter(SavedSearch.user_id == user.id).count()
    )
    total_chats = (
        db.query(PulseChatMessage)
        .filter(
            PulseChatMessage.user_id == user.id,
            PulseChatMessage.role == "user",
        )
        .count()
    )
    return AccountStatsResponse(
        total_searches=total_searches,
        total_results=int(total_results),
        saved_searches=saved_searches,
        total_chats=total_chats,
        member_since=user.created_at,
        last_active=user.last_login_at,
    )


def apply_profile_updates(user: User, updates: dict) -> None:
    if "full_name" in updates and updates["full_name"] is not None:
        user.name = str(updates["full_name"]).strip()
    elif "name" in updates and updates["name"] is not None:
        user.name = str(updates["name"]).strip()

    if "username" in updates:
        username = updates["username"]
        user.username = username.strip() if username else None

    if "bio" in updates:
        bio = updates["bio"]
        user.bio = bio.strip() if bio else None
