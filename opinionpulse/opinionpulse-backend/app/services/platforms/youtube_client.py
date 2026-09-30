"""Shared YouTube Data API v3 HTTP client with quota-aware error handling."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import requests

from app.core.config import get_settings

logger = logging.getLogger(__name__)

API_BASE = "https://www.googleapis.com/youtube/v3"
DEFAULT_TIMEOUT = 15

_session: requests.Session | None = None


class YouTubeApiError(Exception):
    """Structured YouTube API failure."""

    def __init__(
        self,
        message: str,
        *,
        status: int | None = None,
        reasons: list[str] | None = None,
        quota_exceeded: bool = False,
        comments_disabled: bool = False,
        rate_limited: bool = False,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.reasons = reasons or []
        self.quota_exceeded = quota_exceeded
        self.comments_disabled = comments_disabled
        self.rate_limited = rate_limited


@dataclass
class YouTubeHealth:
    status: str = "available"
    error: str | None = None
    quota_exceeded: bool = False


def _session_get() -> requests.Session:
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update(
            {
                "User-Agent": "OpinionPulse/1.0 (youtube-integration)",
                "Accept": "application/json",
            }
        )
    return _session


def api_key_configured() -> bool:
    return bool(get_settings().youtube_api_key.strip())


def require_api_key() -> str:
    key = get_settings().youtube_api_key.strip()
    if not key:
        raise YouTubeApiError(
            "YOUTUBE_API_KEY not configured",
            status=401,
        )
    return key


def _parse_error_response(response: requests.Response) -> YouTubeApiError:
    message = response.text or "YouTube API error"
    reasons: list[str] = []
    try:
        payload = response.json()
        error = payload.get("error") or {}
        message = error.get("message") or message
        for item in error.get("errors") or []:
            if isinstance(item, dict) and item.get("reason"):
                reasons.append(str(item["reason"]))
    except Exception:
        pass

    lower_msg = message.lower()
    comments_disabled = (
        "commentsDisabled" in reasons
        or "disabled comments" in lower_msg
        or "commenting has been disabled" in lower_msg
    )
    quota_exceeded = response.status_code == 403 and (
        "quotaExceeded" in reasons
        or "dailyLimitExceeded" in reasons
        or "quota" in lower_msg
    )
    rate_limited = response.status_code == 429 or "rateLimitExceeded" in reasons

    return YouTubeApiError(
        message,
        status=response.status_code,
        reasons=reasons,
        quota_exceeded=quota_exceeded,
        comments_disabled=comments_disabled,
        rate_limited=rate_limited,
    )


def youtube_get(
    endpoint: str,
    params: dict[str, Any],
    *,
    timeout: float = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    """Perform a GET against the YouTube Data API v3."""
    params = {**params, "key": require_api_key()}
    url = f"{API_BASE}/{endpoint}"
    try:
        resp = _session_get().get(url, params=params, timeout=timeout)
    except requests.Timeout as exc:
        logger.warning("youtube.api.timeout endpoint=%s", endpoint)
        raise YouTubeApiError("YouTube request timed out", status=408) from exc
    except requests.RequestException as exc:
        logger.warning("youtube.api.network_error endpoint=%s err=%s", endpoint, exc)
        raise YouTubeApiError(f"YouTube network error: {exc}") from exc

    if not resp.ok:
        err = _parse_error_response(resp)
        if err.quota_exceeded:
            logger.error("youtube.quota.exceeded endpoint=%s", endpoint)
        elif err.comments_disabled:
            logger.info("youtube.comments.disabled endpoint=%s", endpoint)
        else:
            logger.warning(
                "youtube.api.error endpoint=%s status=%s reasons=%s",
                endpoint,
                err.status,
                err.reasons,
            )
        raise err

    try:
        return resp.json()
    except ValueError as exc:
        raise YouTubeApiError("Invalid JSON from YouTube API") from exc


def batch_video_ids(video_ids: list[str], batch_size: int = 50) -> list[list[str]]:
    """Split video IDs into API-safe batches (max 50 per videos.list call)."""
    clean = [v for v in video_ids if v]
    return [clean[i : i + batch_size] for i in range(0, len(clean), batch_size)]
