"""Track upstream HTTP 429 cooldowns so we stop hammering blocked APIs."""

from __future__ import annotations

import logging
import threading
import time

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_cooldown_until: dict[str, float] = {}

DEFAULT_COOLDOWN_SEC = 300.0


def is_rate_limited(platform: str) -> bool:
    with _lock:
        until = _cooldown_until.get(platform, 0.0)
        if time.time() < until:
            return True
        if until > 0:
            del _cooldown_until[platform]
        return False


def mark_rate_limited(platform: str, seconds: float = DEFAULT_COOLDOWN_SEC) -> None:
    with _lock:
        _cooldown_until[platform] = time.time() + seconds
    logger.warning(
        "%s rate-limited — pausing requests for %.0fs",
        platform,
        seconds,
    )


def remaining_seconds(platform: str) -> float:
    with _lock:
        until = _cooldown_until.get(platform, 0.0)
        return max(0.0, until - time.time())
