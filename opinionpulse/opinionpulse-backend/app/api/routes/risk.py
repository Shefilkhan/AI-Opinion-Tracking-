"""Risk comparison across multiple topics."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.services.age_classifier import classify_age_groups
from app.services.plan_limits import check_search_limit
from app.services.plan_service import increment_usage
from app.services.risk_assessor import assess_risk_level
from app.services.search_service import search_all_platforms
from app.services.sentiment_analysis import (
    analyze_sentiment_intensity,
    calculate_sentiment_summary,
)

router = APIRouter(prefix="/api/risk", tags=["risk"])


class RiskCompareRequest(BaseModel):
    topics: list[str] = Field(default_factory=list)


class RiskCompareItem(BaseModel):
    topic: str
    risk_level: str
    risk_label: str
    risk_score: int
    risk_score_pct: int
    risk_factors: list[str]
    sentiment: dict[str, Any]
    dominant_age: str
    description: str


class RiskCompareResponse(BaseModel):
    comparison: list[RiskCompareItem]
    highest_risk: str
    lowest_risk: str


@router.post("/compare", response_model=RiskCompareResponse)
async def compare_topic_risks(
    request: RiskCompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compare risk levels across 2-5 topics."""
    topics = [t.strip() for t in request.topics if t.strip()]
    if len(topics) < 2 or len(topics) > 5:
        raise HTTPException(status_code=400, detail="Compare 2-5 topics")

    check_search_limit(current_user.id, db)

    results: list[dict[str, Any]] = []
    for topic in topics:
        search_results = await search_all_platforms(topic, limit=8)

        intensity_scores = [
            analyze_sentiment_intensity(
                (r.get("title") or "") + " " + (r.get("content") or ""),
                r.get("engagement", {}),
            )
            for r in search_results
        ]

        sentiment_dist = calculate_sentiment_summary(search_results)
        age_analysis = classify_age_groups(search_results)
        risk = assess_risk_level(topic, sentiment_dist, age_analysis, intensity_scores)

        results.append({
            "topic": topic,
            "risk_level": risk["level"],
            "risk_label": risk["label"],
            "risk_score": risk["score"],
            "risk_score_pct": risk["score_pct"],
            "risk_factors": risk["risk_factors"],
            "sentiment": sentiment_dist,
            "dominant_age": age_analysis["dominant_group"],
            "description": risk["description"],
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    increment_usage(current_user.id, "searches_used", db)

    return RiskCompareResponse(
        comparison=[RiskCompareItem(**item) for item in results],
        highest_risk=results[0]["topic"],
        lowest_risk=results[-1]["topic"],
    )
