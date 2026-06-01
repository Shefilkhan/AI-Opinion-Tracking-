import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import EmailOTP, User
from app.services.email_service import send_otp_email

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_PURPOSES = (
    "register_verification",
    "login_verification",
    "password_reset",
)


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _is_bcrypt_hash(hashed_otp: str) -> bool:
    return hashed_otp.startswith("$2")


def hash_otp(otp_code: str) -> str:
    """Fast HMAC hash for new OTP records (instant login/register)."""
    key = settings.secret_key.encode("utf-8")
    return hmac.new(key, otp_code.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    plain = plain_otp.strip()
    if _is_bcrypt_hash(hashed_otp):
        try:
            return bcrypt.checkpw(
                plain.encode("utf-8"),
                hashed_otp.encode("utf-8"),
            )
        except (ValueError, TypeError):
            return False
    expected = hash_otp(plain)
    return hmac.compare_digest(expected, hashed_otp)


def invalidate_existing_otps(db: Session, user_id: int, purpose: str) -> None:
    (
        db.query(EmailOTP)
        .filter(
            EmailOTP.user_id == user_id,
            EmailOTP.purpose == purpose,
            EmailOTP.is_used.is_(False),
        )
        .update({"is_used": True}, synchronize_session=False)
    )
    db.commit()


def create_email_otp_record(db: Session, user: User, purpose: str) -> str:
    """Persist OTP and return the plain code (email sent separately)."""
    if purpose not in ALLOWED_PURPOSES:
        raise ValueError(f"Invalid OTP purpose: {purpose}")

    invalidate_existing_otps(db, user.id, purpose)
    plain_otp = generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.otp_expire_minutes
    )

    record = EmailOTP(
        user_id=user.id,
        email=user.email,
        otp_code_hash=hash_otp(plain_otp),
        purpose=purpose,
        expires_at=expires_at,
        is_used=False,
        attempt_count=0,
    )
    db.add(record)
    db.commit()
    return plain_otp


def _send_otp_email_task(to_email: str, otp_code: str, purpose: str) -> None:
    send_otp_email(to_email, otp_code, purpose)


def schedule_otp_email(
    background_tasks: Optional[BackgroundTasks],
    to_email: str,
    otp_code: str,
    purpose: str,
) -> None:
    if background_tasks is not None:
        background_tasks.add_task(_send_otp_email_task, to_email, otp_code, purpose)
    else:
        _send_otp_email_task(to_email, otp_code, purpose)


def create_email_otp(
    db: Session,
    user: User,
    purpose: str,
    background_tasks: Optional[BackgroundTasks] = None,
) -> str:
    plain_otp = create_email_otp_record(db, user, purpose)
    schedule_otp_email(background_tasks, user.email, plain_otp, purpose)
    return plain_otp


def dev_otp_payload(plain_otp: str) -> Optional[str]:
    if settings.expose_dev_otp_in_api:
        return plain_otp
    return None


def verify_email_otp(
    db: Session, email: str, otp_code: str, purpose: str
) -> User:
    email_lower = email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email.",
        )

    record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.user_id == user.id,
            EmailOTP.purpose == purpose,
            EmailOTP.is_used.is_(False),
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Please request a new code.",
        )

    now = datetime.now(timezone.utc)
    expires = record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now > expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new code.",
        )

    if record.attempt_count >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new OTP.",
        )

    if not verify_otp_hash(otp_code.strip(), record.otp_code_hash):
        record.attempt_count += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code.",
        )

    record.is_used = True
    record.used_at = now
    db.commit()
    return user
