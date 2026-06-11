from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class SentimentBrief(BaseModel):
    """Nested sentiment on mention responses."""

    sentiment_label: str
    sentiment_score: float
    confidence: float
    model_name: str


class SentimentResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mention_id: int
    sentiment_label: str
    sentiment_score: float
    confidence: float
    model_name: str
    analyzed_at: datetime


class SentimentSummaryResponse(BaseModel):
    total_analyzed: int
    positive: int
    neutral: int
    negative: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float
    average_score: float


class SentimentTrendItem(BaseModel):
    date: str
    positive: int
    neutral: int
    negative: int
    average_score: float


class SentimentTrendsResponse(BaseModel):
    trends: List[SentimentTrendItem]


class AnalyzeProjectResponse(BaseModel):
    analyzed: int
    positive: int
    neutral: int
    negative: int
    message: Optional[str] = None
