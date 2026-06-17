from typing import Literal, Optional

from pydantic import BaseModel


class DashboardStatCard(BaseModel):
    value: str
    subtitle: str
    trend: str = ""
    trend_positive: bool = True
    progress: Optional[int] = None


class DashboardStatsResponse(BaseModel):
    searches_today: DashboardStatCard
    topics_trending: DashboardStatCard
    positive_sentiment: DashboardStatCard
    negative_sentiment: DashboardStatCard


class TrendingTopicItem(BaseModel):
    name: str
    mentions: str
    sentiment: Literal["positive", "negative", "mixed"]
    trend: Literal["up", "down"]
    query: str = ""


class DebateItem(BaseModel):
    id: str
    title: str
    platform: str
    summary: str
    positive_pct: int
    negative_pct: int
    time_ago: str
    query: str
    source_url: str = ""
    source_label: str = ""
    thumbnail: Optional[str] = None


class PlatformPulseItem(BaseModel):
    platform: str
    label: str
    mentions: str
    positive_pct: int
    live: bool = False


class DebateSentimentSplit(BaseModel):
    positive: int
    negative: int
    neutral: int


class LiveDebateItem(BaseModel):
    topic: str
    headline: str
    summary: str
    source_url: str = ""
    source_label: str = ""
    thumbnail: Optional[str] = None
    platforms: list[str] = []
    total_mentions: int = 0
    total_engagement: int = 0
    sentiment: DebateSentimentSplit
    is_heated: bool = False
    posted_at: str = ""
    time_ago: str = "Recently"


class MostDiscussedItem(BaseModel):
    topic: str
    query: str = ""
    emoji: str = "💬"
    total_mentions: int = 0
    total_engagement: int = 0
    sentiment: DebateSentimentSplit
    top_platform: str = "reddit"
    platform_breakdown: dict[str, int] = {}
    trend: Literal["up", "down", "stable"] = "stable"


class DashboardOverviewResponse(BaseModel):
    stats: DashboardStatsResponse
    trending_topics: list[TrendingTopicItem]
    debates: list[DebateItem]
    live_debates: list[LiveDebateItem] = []
    most_discussed: list[MostDiscussedItem] = []
    platform_pulse: list[PlatformPulseItem]
    demo_mode: bool = False
    is_live: dict[str, bool] = {}
    last_updated: Optional[str] = None


class SparklinePoint(BaseModel):
    day: str
    mentions: int


class TopicTableRow(BaseModel):
    id: str
    name: str
    mention_count: int
    sentiment_positive_pct: int
    sentiment_negative_pct: int
    direction: Literal["up", "down", "flat"]
    direction_pct: float
    is_heated_debate: bool = False
    platforms: list[str] = []
    platform_count: int = 0
    sparkline_data: list[SparklinePoint] = []
    last_updated: str = ""


class TopicsTableResponse(BaseModel):
    topics: list[TopicTableRow]
    timeframe: str = "7d"
