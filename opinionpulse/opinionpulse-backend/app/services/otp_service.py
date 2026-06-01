import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_otp_code, verify_otp_code
from app.db.models import EmailOTP, User
from app.services.email_service import EmailSendError, deliver_otp_email

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_PURPOSES = (
    "register_verification",
    "login_verification",
    "password_reset",
)


def generate_otp_code() -> str:
    return f"{secrets.randbelow(900_000) + 100_000:06d}"


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


def count_recent_otps(
    db: Session, email: str, purpose: str, window_minutes: int
) -> int:
    since = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
    return (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email.lower(),
            EmailOTP.purpose == purpose,
            EmailOTP.created_at >= since,
        )
        .count()
    )


def create_email_otp_record(db: Session, user: User, purpose: str) -> str:
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
        otp_code_hash=hash_otp_code(plain_otp),
        purpose=purpose,
        expires_at=expires_at,
        is_used=False,
        attempt_count=0,
    )
    db.add(record)
    db.commit()
    return plain_otp


def create_email_otp(
    db: Session,
    user: User,
    purpose: str,
    background_tasks: Optional[BackgroundTasks] = None,
) -> str:
    del background_tasks  # OTP email is sent synchronously so failures reach the client
    window = settings.otp_resend_window_minutes
    max_sent = settings.otp_resend_max_per_window
    sent = count_recent_otps(db, user.email, purpose, window)
    if sent >= max_sent:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many codes sent. Please wait before requesting another.",
        )
    plain_otp = create_email_otp_record(db, user, purpose)
    try:
        deliver_otp_email(user.email, plain_otp, purpose)
    except EmailSendError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.message,
        ) from exc
    return plain_otp


def dev_otp_payload(plain_otp: str) -> Optional[str]:
    if settings.expose_dev_otp_in_api:
        return plain_otp
    return None


def validate_email_otp(
    db: Session,
    email: str,
    otp_code: str,
    purpose: str,
    *,
    consume: bool = False,
) -> User:
    """Check OTP validity; optionally mark it used (consume=True)."""
    email_lower = email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification request.",
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
            detail="No active code found. Please request a new code.",
        )

    now = datetime.now(timezone.utc)
    expires = record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now > expires:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="OTP expired. Please request a new code.",
        )

    if record.attempt_count >= settings.otp_max_attempts:
        record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum attempts reached. Please request a new code.",
        )

    if not verify_otp_code(otp_code.strip(), record.otp_code_hash):
        record.attempt_count += 1
        db.commit()
        remaining = max(0, settings.otp_max_attempts - record.attempt_count)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect code. {remaining} attempts remaining.",
        )

    if consume:
        record.is_used = True
        record.used_at = now
    db.commit()
    return user


def verify_email_otp(db: Session, email: str, otp_code: str, purpose: str) -> User:
    return validate_email_otp(db, email, otp_code, purpose, consume=True)
