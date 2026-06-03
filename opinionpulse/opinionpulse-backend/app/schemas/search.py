from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)
    platform: str = "all"
    time_range: str = "24h"
    sentiment: str = "all"
    sort_by: str = "recent"


class EngagementStats(BaseModel):
    likes: int = 0
    shares: int = 0
    comments: int = 0


class SearchResultItem(BaseModel):
    id: str
    platform: str
    author: str
    content: str
    sentiment: Literal["positive", "negative", "neutral"]
    sentiment_score: float
    engagement: EngagementStats
    url: str
    posted_at: str


class SentimentSummary(BaseModel):
    positive: float
    negative: float
    neutral: float


class TrendingKeyword(BaseModel):
    word: str
    count: int


class SentimentTrendPoint(BaseModel):
    time: str
    positive: int
    negative: int
    volume: int


class SearchResponse(BaseModel):
    query: str
    total_results: int
    sentiment_summary: SentimentSummary
    platforms_searched: list[str]
    demo_mode: bool = False
    peak_discussion: Optional[str] = None
    most_active_platform: Optional[str] = None
    results: list[SearchResultItem]
    trending_keywords: list[TrendingKeyword]
    related_topics: list[str]
    sentiment_trend: list[SentimentTrendPoint] = []


class SearchHistoryItem(BaseModel):
    id: str
    query: str
    results_count: int
    sentiment_positive: Optional[int] = None
    sentiment_negative: Optional[int] = None
    sentiment_neutral: Optional[int] = None
    searched_at: datetime

    model_config = {"from_attributes": True}


class SearchHistoryListResponse(BaseModel):
    items: list[SearchHistoryItem]
