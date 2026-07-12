"""Velocity, volume, and quadrant math for brand crisis detection."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

Quadrant = Literal["quiet", "noise", "watch", "crisis"]

# Thresholds (0–100 scale) — tuned for clarity on the radar chart
VOLUME_HIGH = 50.0
VELOCITY_HIGH = 50.0

QUADRANT_LABELS: dict[Quadrant, str] = {
    "quiet": "Normal",
    "noise": "High volume — stable",
    "watch": "Accelerating — watch closely",
    "crisis": "Crisis — act now",
}

QUADRANT_EXPLANATIONS: dict[Quadrant, str] = {
    "quiet": "Mention volume and negative acceleration are within normal range.",
    "noise": "Many people are talking, but negativity is not speeding up.",
    "watch": "Negative mentions are accelerating faster than usual — early warning.",
    "crisis": "High volume AND rapid acceleration — likely a PR or security fire.",
}


def floor_to_bucket(dt: datetime, minutes: int = 30) -> datetime:
    """Align datetime to the start of a fixed-width bucket."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    minute = (dt.minute // minutes) * minutes
    return dt.replace(minute=minute, second=0, microsecond=0)


def score_volume(current_mentions: int, baseline_mentions: float) -> float:
    """0–100 score for mention volume in the current window."""
    baseline = max(baseline_mentions, 1.0)
    ratio = current_mentions / baseline
    return round(min(100.0, ratio * 40.0), 1)


def score_velocity(current_negative: int, baseline_negative: float) -> float:
    """0–100 score for negative-mention acceleration."""
    baseline = max(baseline_negative, 0.5)
    ratio = current_negative / baseline
    return round(min(100.0, ratio * 35.0), 1)


def classify_quadrant(volume_score: float, velocity_score: float) -> Quadrant:
    high_vol = volume_score >= VOLUME_HIGH
    high_vel = velocity_score >= VELOCITY_HIGH
    if high_vol and high_vel:
        return "crisis"
    if high_vel:
        return "watch"
    if high_vol:
        return "noise"
    return "quiet"


def bucket_counts(results: list[dict]) -> dict[str, int]:
    counts = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
    for row in results:
        sentiment = (row.get("sentiment") or "neutral").lower()
        if sentiment not in counts:
            sentiment = "neutral"
        counts[sentiment] += 1
        counts["total"] += 1
    return counts


def filter_results_in_window(
    results: list[dict],
    *,
    start: datetime,
    end: datetime,
) -> list[dict]:
    """Keep results whose posted_at falls in [start, end)."""
    kept: list[dict] = []
    for row in results:
        posted_raw = row.get("posted_at")
        if not posted_raw:
            continue
        try:
            if isinstance(posted_raw, datetime):
                posted = posted_raw
            else:
                from dateutil.parser import parse

                posted = parse(str(posted_raw))
            if posted.tzinfo is None:
                posted = posted.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        if start <= posted < end:
            kept.append(row)
    return kept


def compute_metrics_from_history(
    historical_buckets: list[tuple[datetime, int, int]],
    *,
    current_total: int,
    current_negative: int,
) -> tuple[float, float, float, Quadrant]:
    """
    historical_buckets: list of (bucket_start, mention_count, negative_count)
    Returns volume_score, velocity_score, baseline_negative, quadrant
    """
    if historical_buckets:
        avg_mentions = sum(b[1] for b in historical_buckets) / len(historical_buckets)
        avg_negative = sum(b[2] for b in historical_buckets) / len(historical_buckets)
    else:
        avg_mentions = max(current_total * 0.5, 1.0)
        avg_negative = max(current_negative * 0.5, 0.5)

    volume = score_volume(current_total, avg_mentions)
    velocity = score_velocity(current_negative, avg_negative)
    quadrant = classify_quadrant(volume, velocity)
    return volume, velocity, round(avg_negative, 2), quadrant
