"""Create or link users from Google OAuth profiles."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import User
from app.services.google_oauth_service import GoogleUserInfo, oauth_password_placeholder


def get_or_create_google_user(db: Session, profile: GoogleUserInfo) -> User:
    by_google = (
        db.query(User).filter(User.google_id == profile.google_id).first()
    )
    if by_google is not None:
        _sync_google_profile(by_google, profile)
        db.commit()
        db.refresh(by_google)
        return by_google

    by_email = db.query(User).filter(User.email == profile.email).first()
    if by_email is not None:
        if by_email.google_id and by_email.google_id != profile.google_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is linked to a different Google account.",
            )
        by_email.google_id = profile.google_id
        _sync_google_profile(by_email, profile)
        if profile.email_verified:
            by_email.is_email_verified = True
        db.commit()
        db.refresh(by_email)
        return by_email

    user = User(
        name=profile.name,
        email=profile.email,
        password_hash=oauth_password_placeholder(),
        google_id=profile.google_id,
        avatar_url=profile.avatar_url,
        role="user",
        is_email_verified=profile.email_verified,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _sync_google_profile(user: User, profile: GoogleUserInfo) -> None:
    if profile.name and (not user.name or user.name == "User"):
        user.name = profile.name
    if profile.avatar_url:
        user.avatar_url = profile.avatar_url
    user.last_login_at = datetime.now(timezone.utc)
