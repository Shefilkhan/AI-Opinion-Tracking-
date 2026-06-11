from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_session_token
from app.db.models import AuthSession, User

settings = get_settings()


def _request_meta(request: Optional[Request]) -> Tuple[Optional[str], Optional[str]]:
    if request is None:
        return None, None
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    return ip, ua[:512] if ua else None


def create_user_session(
    db: Session,
    user: User,
    request: Optional[Request] = None,
) -> str:
    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.access_token_expire_days
    )
    ip, ua = _request_meta(request)
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_session_token(token),
            expires_at=expires_at,
            ip_address=ip,
            user_agent=ua,
        )
    )
    db.commit()
    return token


def revoke_token_session(db: Session, token: str) -> None:
    token_hash = hash_session_token(token)
    (
        db.query(AuthSession)
        .filter(AuthSession.token_hash == token_hash)
        .delete(synchronize_session=False)
    )
    db.commit()


def is_session_valid(db: Session, token: str) -> bool:
    from app.core.security import decode_access_token

    payload = decode_access_token(token)
    if payload is None or payload.get("pre_auth"):
        return False

    token_hash = hash_session_token(token)
    now = datetime.now(timezone.utc)
    row = (
        db.query(AuthSession)
        .filter(AuthSession.token_hash == token_hash)
        .first()
    )
    if row is None:
        return True
    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires > now
