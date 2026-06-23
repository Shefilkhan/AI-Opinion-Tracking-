"""Pydantic schemas for structured risk analysis."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


# ─── Internal: LLM output validation ─────────────────────────────────────────


class GrokRationale(BaseModel):
    """Structured rationale extracted by the LLM."""

    primary_reason: str = Field(
        ...,
        description="One sentence (≤ 20 words) explaining the main risk driver.",
    )
    contributing_factors: list[str] = Field(
        default_factory=list,
        description="Up to 3 short contributing factors (≤ 8 words each).",
    )

    @field_validator("contributing_factors")
    @classmethod
    def cap_factors(cls, v: list[str]) -> list[str]:
        return v[:3]


class GrokSignals(BaseModel):
    """
    Strict schema for what the LLM must return.
    Used for validation only — risk_level is NOT in here (computed by our engine).
    """

    content_type: Literal["comment", "post", "reel", "image"]
    sentiment: Literal["positive", "neutral", "negative"]
    sentiment_intensity: Literal["low", "medium", "high"]
    age_group: Literal["kids", "teen", "adult"]
    risk_rationale: GrokRationale


# ─── Public request / response ───────────────────────────────────────────────


class RiskAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=1, description="The social media content to analyse.")
    social_media_usage_hours: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=24.0,
        description=(
            "Estimated daily hours the subject spends on social media. "
            "When omitted the scoring engine uses 3.0 as the default."
        ),
    )


class RiskRationale(BaseModel):
    primary_reason: str
    contributing_factors: list[str]


class RiskAnalysisResponse(BaseModel):
    content_type: Literal["comment", "post", "reel", "image"]
    sentiment: Literal["positive", "neutral", "negative"]
    sentiment_intensity: Literal["low", "medium", "high"]
    age_group: Literal["kids", "teen", "adult"]
    social_media_usage_hours: float
    risk_level: Literal["low", "mild", "average", "high"]
    risk_rationale: RiskRationale
    composite_score: float
    ai_enabled: bool = True


# ─── Person-level schemas ─────────────────────────────────────────────────────


class PersonRiskItem(BaseModel):
    """A single content item to include in a person-level analysis."""

    content: str = Field(..., min_length=1, description="The social-media content text.")


class PersonRiskRequest(BaseModel):
    subject_handle: str = Field(
        default="Anonymous",
        description="Display name / handle of the person being analysed.",
    )
    items: list[PersonRiskItem] = Field(
        ...,
        min_length=1,
        max_length=15,
        description="Up to 15 content items to aggregate (e.g. all posts by this person).",
    )
    social_media_usage_hours: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=24.0,
        description="Person's estimated daily social-media usage hours. Defaults to 3.0.",
    )


class PersonRiskResponse(BaseModel):
    subject_handle: str
    item_count: int
    social_media_usage_hours: float
    dominant_content_type: Literal["comment", "post", "reel", "image"]
    avg_composite_score: float          # 0.0 – 3.0
    peak_risk_level: Literal["low", "mild", "average", "high"]
    aggregate_risk_level: Literal["low", "mild", "average", "high"]
    risk_distribution: dict             # {"low": n, "mild": n, "average": n, "high": n}
    item_analyses: list[RiskAnalysisResponse]  # full per-item detail
    ai_enabled: bool = True
