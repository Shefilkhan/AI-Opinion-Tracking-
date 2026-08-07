"""Detect placeholder vs real API keys in environment settings."""

from __future__ import annotations

import re

_PLACEHOLDER_FRAGMENTS = (
    "your_",
    "_here",
    "changeme",
    "change_this",
    "replace_me",
    "insert_",
    "xxx",
    "example",
    "placeholder",
    "todo",
    "fixme",
    "api_key_here",
    "access_token_here",
    "app_password_here",
)

_PLACEHOLDER_RE = re.compile(
    r"^(test|demo|fake|dummy|null|none|undefined)$",
    re.IGNORECASE,
)


def is_valid_api_key(value: str | None) -> bool:
    """True when the value looks like a real credential, not a template."""
    if not value or not isinstance(value, str):
        return False
    cleaned = value.strip()
    if len(cleaned) < 8:
        return False
    lower = cleaned.lower()
    if _PLACEHOLDER_RE.match(lower):
        return False
    if any(fragment in lower for fragment in _PLACEHOLDER_FRAGMENTS):
        return False
    return True
