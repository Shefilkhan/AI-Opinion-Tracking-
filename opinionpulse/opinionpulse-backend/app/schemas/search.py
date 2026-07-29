from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)
    platform: str = "all"
    time_range: str = "24h"
    sentiment: str = "all"
    sort_by: str = "recent"
    language: str = "all"


class EngagementStats(BaseModel):
    likes: int = 0
    shares: int = 0
    comments: int = 0
    views: int = 0


class SentimentDetail(BaseModel):
    direction: Literal["positive", "negative", "neutral"]
    intensity: Literal["low", "medium", "high"]
    label: str
    score: int = 0


class SourceHealthItem(BaseModel):
    status: str
    count: int = 0
    message: Optional[str] = None


class DataFreshness(BaseModel):
    fetched_at: str
    sources_used: int = 0
    sources_failed: int = 0


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
    content_type: Optional[str] = None
    sentiment_detail: Optional[SentimentDetail] = None
    relevance_score: Optional[float] = None
    engagement_available: bool = True

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


class AgeAnalysis(BaseModel):
    distribution: dict[str, int]
    dominant_group: str
    label: str


class UsageContextItem(BaseModel):
    age_group: str
    avg_daily_hours: float
    typical_range: str
    usage_risk: str


class RiskAssessment(BaseModel):
    level: Literal["mild", "average", "high"]
    label: str
    score: int
    max_score: int = 12
    score_pct: int
    description: str
    color: str
    risk_factors: list[str] = Field(default_factory=list)


class QueryMeta(BaseModel):
    original: str
    cleaned: str
    intent: str
    expansions: list[str] = Field(default_factory=list)


class SearchMetadata(BaseModel):
    spam_filtered: int = 0
    non_english_filtered: int = 0
    brand_noise_filtered: int = 0
    youtube_comments_included: int = 0


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
    locked_sources: Optional[list[str]] = None
    upgrade_message: Optional[str] = None
    peak_discussion: Optional[str] = None
    most_active_platform: Optional[str] = None
    results: list[SearchResultItem]
    trending_keywords: list[TrendingKeyword]
    related_topics: list[str]
    sentiment_trend: list[SentimentTrendPoint] = []
    sentiment_forecast: list[dict] = Field(default_factory=list)
    last_updated: Optional[str] = None
    age_analysis: Optional[AgeAnalysis] = None
    usage_context: Optional[list[UsageContextItem]] = None
    risk_assessment: Optional[RiskAssessment] = None
    source_health: Optional[dict[str, SourceHealthItem]] = None
    data_freshness: Optional[DataFreshness] = None
    relevance_mode: Optional[str] = None
    query_meta: Optional[QueryMeta] = None
    search_metadata: Optional[SearchMetadata] = None


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
