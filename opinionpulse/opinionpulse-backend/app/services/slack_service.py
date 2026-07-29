"""Slack incoming webhook alerts for crisis detection."""

from __future__ import annotations

import logging

import requests

logger = logging.getLogger(__name__)


def send_slack_crisis_alert(
    webhook_url: str,
    *,
    watch_name: str,
    keyword: str,
    volume_score: float,
    velocity_score: float,
    summary: str,
    spike_label: str = "",
    frontend_url: str = "http://localhost:5173",
) -> bool:
    if not webhook_url or not webhook_url.startswith("https://hooks.slack.com/"):
        logger.warning("Invalid Slack webhook URL — alert skipped")
        return False

    crisis_url = f"{frontend_url.rstrip('/')}/crisis?watch={keyword}"
    text = (
        f":rotating_light: *Crisis alert — {watch_name}*\n"
        f"Volume {volume_score}/100 · Velocity {velocity_score}/100\n"
    )
    if spike_label:
        text += f"{spike_label}\n"
    text += f"{summary}\n<{crisis_url}|Open Crisis Radar>"

    payload = {
        "text": f"Crisis alert: {watch_name}",
        "blocks": [
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": text},
            }
        ],
    }

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Slack alert failed: %s", exc)
        return False
