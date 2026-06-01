from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class RecentProjectItem(BaseModel):
    id: int
    name: str
    mentions_count: int
    keywords_count: int
    positive_percentage: float = 0.0
    negative_percentage: float = 0.0


class LatestSentimentSnapshot(BaseModel):
    project_id: int
    project_name: str
    positive: int
    neutral: int
    negative: int
    average_score: float


class DashboardSummaryResponse(BaseModel):
    total_projects: int
    total_mentions: int
    total_analyzed: int
    total_reports: int
    recent_projects: List[RecentProjectItem]
    latest_sentiment: Optional[LatestSentimentSnapshot] = None


class TrendingNewsItem(BaseModel):
    title: str
    source: str
    url: Optional[str] = None
    published_at: Optional[datetime] = None
    suggested_keyword: str


class TrendingNewsResponse(BaseModel):
    items: List[TrendingNewsItem]
    message: str
