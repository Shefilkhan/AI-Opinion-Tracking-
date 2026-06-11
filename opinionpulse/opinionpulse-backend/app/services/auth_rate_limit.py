"""In-memory rate limiting for auth endpoints (dev/single-instance)."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import HTTPException, Request, status

_lock = Lock()
_buckets: dict[str, list[datetime]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _prune(key: str, window: timedelta) -> None:
    cutoff = datetime.now(timezone.utc) - window
    _buckets[key] = [t for t in _buckets[key] if t > cutoff]


def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    window = timedelta(seconds=window_seconds)
    with _lock:
        _prune(key, window)
        if len(_buckets[key]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        _buckets[key].append(datetime.now(timezone.utc))


def rate_limit_by_ip(request: Request, prefix: str, max_requests: int, window_seconds: int) -> None:
    check_rate_limit(f"{prefix}:ip:{_client_ip(request)}", max_requests, window_seconds)


def rate_limit_by_email(email: str, prefix: str, max_requests: int, window_seconds: int) -> None:
    check_rate_limit(
        f"{prefix}:email:{email.lower().strip()}",
        max_requests,
        window_seconds,
    )
