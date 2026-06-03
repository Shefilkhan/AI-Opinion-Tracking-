from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


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
    views: int = 0


class SearchResultItem(BaseModel):
    id: str
    platform: str
    author: str
    content: str
    sentiment: Literal["positive", "negative", "neutral"]
    sentiment_score: float
    engagement: EngagementStats
    source_url: str = ""
    url: str = ""
    posted_at: str
    title: str = ""
    source_label: str = ""
    publication: str = ""
    image_url: Optional[str] = None
    thumbnail: Optional[str] = None
    is_demo: bool = False

    @model_validator(mode="after")
    def sync_url_fields(self):
        if self.source_url and not self.url:
            self.url = self.source_url
        elif self.url and not self.source_url:
            self.source_url = self.url
        if self.image_url and not self.thumbnail:
            self.thumbnail = self.image_url
        elif self.thumbnail and not self.image_url:
            self.image_url = self.thumbnail
        return self


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
    neutral: int = 0
    volume: int = 0


class WikiSummary(BaseModel):
    title: str
    summary: str
    url: str
    thumbnail: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    total_results: int
    sentiment_summary: SentimentSummary
    platforms_searched: list[str]
    platforms_live: dict[str, bool] = {}
    apis_configured: dict[str, bool] = {}
    demo_mode: bool = False
    wiki_summary: Optional[WikiSummary] = None
    errors: Optional[list[str]] = None
    peak_discussion: Optional[str] = None
    most_active_platform: Optional[str] = None
    results: list[SearchResultItem]
    trending_keywords: list[TrendingKeyword]
    related_topics: list[str]
    sentiment_trend: list[SentimentTrendPoint] = []
    last_updated: Optional[str] = None


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
