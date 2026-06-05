from typing import Any, Optional

from pydantic import BaseModel, Field


class AiSummarizeRequest(BaseModel):
    query: str = ""
    results: list[dict[str, Any]] = Field(default_factory=list)
    sentiment_summary: dict[str, Any] = Field(default_factory=dict)


class AiDebateRequest(BaseModel):
    topic: str = ""
    results: list[dict[str, Any]] = Field(default_factory=list)


class AiPredictRequest(BaseModel):
    query: str = ""
    results: list[dict[str, Any]] = Field(default_factory=list)
    sentiment_summary: dict[str, Any] = Field(default_factory=dict)
    time_range: str = "24h"


class AiStatusResponse(BaseModel):
    enabled: bool


class AiSummarizeResponse(BaseModel):
    summary: dict[str, Any]
    ai_enabled: bool = True


class AiDebateResponse(BaseModel):
    debate: dict[str, Any]
    ai_enabled: bool = True


class AiPredictResponse(BaseModel):
    prediction: dict[str, Any]
    ai_enabled: bool = True


class AiInsightOfTheDayResponse(BaseModel):
    enabled: bool
    insight: Optional[dict[str, Any]] = None
