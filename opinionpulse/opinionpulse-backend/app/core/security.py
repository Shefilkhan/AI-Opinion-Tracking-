import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(rounds=settings.bcrypt_rounds),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def hash_otp_code(otp_code: str) -> str:
    """SHA-256 HMAC with OTP pepper (spec-aligned, fast for 6-digit codes)."""
    key = settings.otp_secret.encode("utf-8")
    msg = f"{otp_code.strip()}{settings.otp_secret}".encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def verify_otp_code(plain_otp: str, stored_hash: str) -> bool:
    plain = plain_otp.strip()
    if stored_hash.startswith("$2"):
        try:
            return bcrypt.checkpw(
                plain.encode("utf-8"),
                stored_hash.encode("utf-8"),
            )
        except (ValueError, TypeError):
            return False
    expected = hash_otp_code(plain)
    return hmac.compare_digest(expected, stored_hash)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    data: Dict[str, Any],
    *,
    expires_minutes: Optional[int] = None,
) -> str:
    to_encode = data.copy()
    minutes = expires_minutes or settings.access_token_expire_minutes
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    to_encode.setdefault("jti", str(uuid.uuid4()))
    to_encode["exp"] = expire
    to_encode["iat"] = datetime.now(timezone.utc)
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_pre_auth_token(user_id: int, email: str) -> str:
    """Short-lived token before OTP verification (10 minutes)."""
    return create_access_token(
        {"sub": str(user_id), "email": email, "pre_auth": True},
        expires_minutes=10,
    )


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
    except JWTError:
        return None
