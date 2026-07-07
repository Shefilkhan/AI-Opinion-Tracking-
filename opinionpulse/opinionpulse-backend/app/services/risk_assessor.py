"""Topic-level risk assessment from sentiment, age, and topic sensitivity."""

from __future__ import annotations

from typing import Any

HIGH_RISK_TOPICS = [
    "depression", "anxiety", "suicide", "self-harm", "mental health",
    "eating disorder", "addiction", "trauma", "abuse",
    "bullying", "cyberbullying", "harassment", "hate speech",
    "misinformation", "conspiracy", "radicalization",
    "violence", "drug", "weapon", "dangerous", "scam", "fraud",
]

MEDIUM_RISK_TOPICS = [
    "political", "controversial", "debate", "conflict",
    "protest", "crisis", "regulation", "ban", "censorship",
    "privacy", "surveillance", "manipulation",
]


def assess_risk_level(
    query: str,
    sentiment_distribution: dict[str, Any],
    age_analysis: dict[str, Any],
    intensity_scores: list[dict[str, Any]],
) -> dict[str, Any]:
    """Calculate overall risk level: mild / average / high."""
    risk_score = 0
    risk_factors: list[str] = []

    query_lower = query.lower()

    high_risk_match = any(t in query_lower for t in HIGH_RISK_TOPICS)
    medium_risk_match = any(t in query_lower for t in MEDIUM_RISK_TOPICS)

    if high_risk_match:
        risk_score += 4
        risk_factors.append("High-sensitivity topic detected")
    elif medium_risk_match:
        risk_score += 2
        risk_factors.append("Controversial topic detected")

    neg_pct = sentiment_distribution.get("negative", 0)
    if neg_pct >= 60:
        risk_score += 3
        risk_factors.append(f"High negative sentiment ({neg_pct}%)")
    elif neg_pct >= 40:
        risk_score += 2
        risk_factors.append(f"Elevated negative sentiment ({neg_pct}%)")
    elif neg_pct >= 25:
        risk_score += 1
        risk_factors.append(f"Moderate negative sentiment ({neg_pct}%)")

    high_intensity_count = sum(
        1 for s in intensity_scores if s.get("intensity") == "high"
    )
    high_intensity_pct = (high_intensity_count / max(len(intensity_scores), 1)) * 100
    if high_intensity_pct >= 40:
        risk_score += 2
        risk_factors.append(f"{round(high_intensity_pct)}% high-intensity posts")
    elif high_intensity_pct >= 20:
        risk_score += 1

    distribution = age_analysis.get("distribution", {})
    dominant = age_analysis.get("dominant_group", "adults")
    kids_teens_pct = distribution.get("kids", 0) + distribution.get("teens", 0)
    if dominant in ("kids", "teens") or kids_teens_pct >= 50:
        risk_score += 3
        risk_factors.append(f"Young audience: {kids_teens_pct}% kids/teens")
    elif kids_teens_pct >= 30:
        risk_score += 1
        risk_factors.append(f"Partial young audience ({kids_teens_pct}%)")

    if risk_score >= 7:
        level = "high"
        label = "🔴 High Risk"
        description = "This content shows multiple risk indicators. Careful review recommended."
        color = "DC2626"
    elif risk_score >= 3:
        level = "average"
        label = "🟡 Average Risk"
        description = "Some risk indicators present. Monitor engagement trends."
        color = "D97706"
    else:
        level = "mild"
        label = "🟢 Mild Risk"
        description = "Low risk indicators. Content appears within normal ranges."
        color = "16A34A"

    return {
        "level": level,
        "label": label,
        "score": risk_score,
        "max_score": 12,
        "score_pct": round((risk_score / 12) * 100),
        "description": description,
        "color": color,
        "risk_factors": risk_factors,
    }
