import logging
from typing import Optional

from fastapi import Request

logger = logging.getLogger("opinionpulse.auth")


def _client_ip(request: Optional[Request]) -> str:
    if request is None:
        return "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def log_auth_event(
    event: str,
    *,
    email: Optional[str] = None,
    user_id: Optional[int] = None,
    request: Optional[Request] = None,
    extra: Optional[str] = None,
) -> None:
    ip = _client_ip(request)
    parts = [f"event={event}", f"ip={ip}"]
    if email:
        parts.append(f"email={email.lower()}")
    if user_id is not None:
        parts.append(f"user_id={user_id}")
    if extra:
        parts.append(extra)
    logger.info("[auth] %s", " ".join(parts))
