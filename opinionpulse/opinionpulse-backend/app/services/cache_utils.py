"""Simple in-memory TTL cache for external API responses."""

from __future__ import annotations

import time
from typing import Any, Callable, Optional, TypeVar

from app.core.config import get_settings

T = TypeVar("T")

_store: dict[str, tuple[float, Any]] = {}


def cache_get(key: str) -> Optional[Any]:
    entry = _store.get(key)
    if not entry:
        return None
    expires_at, value = entry
    if time.time() > expires_at:
        del _store[key]
        return None
    print(f"📦 Cache hit: {key}")
    return value


def cache_set(key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
    ttl = ttl_seconds if ttl_seconds is not None else get_settings().cache_duration_seconds
    _store[key] = (time.time() + ttl, value)
    size = len(value) if isinstance(value, list) else 1
    print(f"💾 Cached: {key} ({size} results)")


def cached(key: str, fetcher: Callable[[], T], ttl_seconds: Optional[int] = None) -> T:
    hit = cache_get(key)
    if hit is not None:
        return hit
    value = fetcher()
    cache_set(key, value, ttl_seconds)
    return value


def get_cached(key: str) -> Optional[Any]:
    """Alias for cache_get (AI service compatibility)."""
    return cache_get(key)


def set_cached(key: str, value: Any, duration: Optional[int] = None) -> None:
    """Alias for cache_set with explicit TTL in seconds."""
    cache_set(key, value, duration)
