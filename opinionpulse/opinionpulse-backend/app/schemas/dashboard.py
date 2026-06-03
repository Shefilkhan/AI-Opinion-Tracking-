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


class DebateItem(BaseModel):
    id: str
    title: str
    platform: str
    summary: str
    positive_pct: int
    negative_pct: int
    time_ago: str
    query: str


class PlatformPulseItem(BaseModel):
    platform: str
    label: str
    mentions: str
    positive_pct: int


class DashboardOverviewResponse(BaseModel):
    stats: DashboardStatsResponse
    trending_topics: list[TrendingTopicItem]
    debates: list[DebateItem]
    platform_pulse: list[PlatformPulseItem]
    demo_mode: bool = False
