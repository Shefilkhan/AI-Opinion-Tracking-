"""
Deterministic risk scoring engine.

This module computes a risk level purely from extracted signals — NO LLM calls.
The LLM's job is to classify the signals; this module's job is to compute the score.

Scoring rubric:
  Sentiment         : negative=2, neutral=1, positive=0   (weight 30 %)
  Sentiment intensity: high=3,    medium=2,  low=1         (weight 20 %)
  Age group         : kids=3,     teen=2,    adult=1       (weight 30 %)
  Hours/day on SM   : >=6h→3,    >=3h→2,   >=1h→1, <1h→0 (weight 20 %)

Composite score range: 0.0 – 3.0
Thresholds → risk level:
  0.00 – 0.79  →  low
  0.80 – 1.49  →  mild
  1.50 – 2.19  →  average
  2.20 – 3.00  →  high
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

# ─── Enum aliases ────────────────────────────────────────────────────────────

ContentType = Literal["comment", "post", "reel", "image"]
SentimentLabel = Literal["positive", "neutral", "negative"]
SentimentIntensity = Literal["low", "medium", "high"]
AgeGroup = Literal["kids", "teen", "adult"]
RiskLevel = Literal["low", "mild", "average", "high"]

# ─── Point maps ──────────────────────────────────────────────────────────────

_SENTIMENT_POINTS: dict[str, float] = {
    "negative": 2.0,
    "neutral": 1.0,
    "positive": 0.0,
}

_INTENSITY_POINTS: dict[str, float] = {
    "high": 3.0,
    "medium": 2.0,
    "low": 1.0,
}

_AGE_POINTS: dict[str, float] = {
    "kids": 3.0,
    "teen": 2.0,
    "adult": 1.0,
}

# ─── Weights ─────────────────────────────────────────────────────────────────

_W_SENTIMENT = 0.30
_W_INTENSITY = 0.20
_W_AGE = 0.30
_W_HOURS = 0.20

# ─── Thresholds ──────────────────────────────────────────────────────────────

_THRESHOLDS: list[tuple[float, RiskLevel]] = [
    (2.20, "high"),
    (1.50, "average"),
    (0.80, "mild"),
    (0.00, "low"),
]


# ─── Data classes ────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class RiskSignals:
    """Signals extracted by the LLM — all required."""

    content_type: str  # comment | post | reel | image
    sentiment: str  # positive | neutral | negative
    sentiment_intensity: str  # low | medium | high
    age_group: str  # kids | teen | adult


@dataclass(frozen=True)
class RiskResult:
    """Output of the scoring engine."""

    risk_level: RiskLevel
    composite_score: float  # 0.0 – 3.0, two decimal places


# ─── Public API ──────────────────────────────────────────────────────────────


def _hours_points(hours: float) -> float:
    if hours >= 6.0:
        return 3.0
    if hours >= 3.0:
        return 2.0
    if hours >= 1.0:
        return 1.0
    return 0.0


def _score_to_risk(score: float) -> RiskLevel:
    for threshold, level in _THRESHOLDS:
        if score >= threshold:
            return level
    return "low"


def compute_risk(signals: RiskSignals, hours_on_social_media: float = 3.0) -> RiskResult:
    """
    Compute a deterministic risk level from extracted LLM signals + usage hours.

    Args:
        signals: Structured signals from LLM (content_type, sentiment,
                 sentiment_intensity, age_group).
        hours_on_social_media: Daily hours spent on social media. Defaults to
                               3.0 when the caller does not supply a value.

    Returns:
        RiskResult with risk_level and composite_score.
    """
    sentiment_pts = _SENTIMENT_POINTS.get(signals.sentiment.lower(), 1.0)
    intensity_pts = _INTENSITY_POINTS.get(signals.sentiment_intensity.lower(), 2.0)
    age_pts = _AGE_POINTS.get(signals.age_group.lower(), 1.0)
    hours_pts = _hours_points(max(0.0, hours_on_social_media))

    composite = (
        sentiment_pts * _W_SENTIMENT
        + intensity_pts * _W_INTENSITY
        + age_pts * _W_AGE
        + hours_pts * _W_HOURS
    )
    composite = round(min(3.0, max(0.0, composite)), 2)
    return RiskResult(risk_level=_score_to_risk(composite), composite_score=composite)


# ─── Person-level aggregation ────────────────────────────────────────────────


@dataclass(frozen=True)
class PersonRiskResult:
    """Aggregate risk verdict for a person across many content items."""

    aggregate_risk_level: RiskLevel
    avg_composite_score: float
    peak_risk_level: RiskLevel
    dominant_content_type: str          # most frequent content_type in items
    risk_distribution: dict             # {"low": n, "mild": n, "average": n, "high": n}
    item_count: int


def aggregate_person_risk(
    item_results: list[tuple[RiskSignals, RiskResult]],
    hours_on_social_media: float = 3.0,
) -> PersonRiskResult:
    """
    Roll up a list of (signals, result) pairs into a person-level risk verdict.

    Strategy:
    - avg_composite_score = mean of individual composite scores
    - aggregate_risk_level = threshold applied to avg_composite_score
    - peak_risk_level = highest individual risk seen
    - dominant_content_type = mode of content_type across items
    - risk_distribution = count of each risk level

    Args:
        item_results: List of (RiskSignals, RiskResult) pairs from compute_risk().
        hours_on_social_media: Person's daily usage hours (already factored into
                               each individual compute_risk call, echoed here for context).

    Returns:
        PersonRiskResult with aggregate verdict.
    """
    if not item_results:
        return PersonRiskResult(
            aggregate_risk_level="low",
            avg_composite_score=0.0,
            peak_risk_level="low",
            dominant_content_type="post",
            risk_distribution={"low": 0, "mild": 0, "average": 0, "high": 0},
            item_count=0,
        )

    scores = [r.composite_score for _, r in item_results]
    avg_score = round(sum(scores) / len(scores), 2)

    # Peak = highest-order risk seen
    _RISK_ORDER = {"high": 3, "average": 2, "mild": 1, "low": 0}
    peak = max((r.risk_level for _, r in item_results), key=lambda lvl: _RISK_ORDER.get(lvl, 0))

    # Distribution
    dist: dict[str, int] = {"low": 0, "mild": 0, "average": 0, "high": 0}
    for _, r in item_results:
        dist[r.risk_level] = dist.get(r.risk_level, 0) + 1

    # Dominant content type (mode)
    ct_counts: dict[str, int] = {}
    for sig, _ in item_results:
        ct_counts[sig.content_type] = ct_counts.get(sig.content_type, 0) + 1
    dominant_ct = max(ct_counts, key=ct_counts.get) if ct_counts else "post"

    return PersonRiskResult(
        aggregate_risk_level=_score_to_risk(avg_score),
        avg_composite_score=avg_score,
        peak_risk_level=peak,
        dominant_content_type=dominant_ct,
        risk_distribution=dist,
        item_count=len(item_results),
    )
