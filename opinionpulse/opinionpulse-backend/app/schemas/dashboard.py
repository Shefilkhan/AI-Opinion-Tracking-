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
    mention_count: int = 0
    activity_change_pct: Optional[float] = None
    sentiment_net: Optional[int] = None


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


class DashboardKpiSummary(BaseModel):
    monitored_topics: int = 0
    alerts_count: int = 0
    avg_sentiment_label: str = "neutral"
    avg_positive_pct: float = 0
    sentiment_change_pp: Optional[float] = None
    content_analyzed: int = 0
    sources_live: int = 0
    sources_total: int = 0
    top_source: str = ""


class TodaysPulse(BaseModel):
    items_analyzed: int = 0
    positive_pct: float = 0
    neutral_pct: float = 0
    negative_pct: float = 0
    activity_change_pct: Optional[float] = None
    top_source: str = ""
    sources_live: int = 0
    sources_total: int = 0


class AttentionItem(BaseModel):
    severity: Literal["critical", "warning", "info"] = "info"
    topic: str
    watch_id: Optional[str] = None
    headline: str
    detail: str = ""
    main_issue: str = ""
    main_source: str = ""
    action_label: str = "Investigate"
    action_href: str = "/search"


class ChangeItem(BaseModel):
    topic: str
    metric: str
    change: str
    direction: Literal["up", "down", "stable"] = "stable"


class GroupedRecentAnalysis(BaseModel):
    query: str
    search_count_today: int = 0
    latest_results_count: int = 0
    latest_sentiment_net: Optional[int] = None
    last_searched_at: str


class WeeklyActivityPoint(BaseModel):
    day: str
    mentions: int = 0
    positive_pct: float = 0
    negative_pct: float = 0
    neutral_pct: float = 0


class MonitoredTopicRow(BaseModel):
    watch_id: str
    name: str
    query: str
    mention_count: int = 0
    sentiment_label: str = ""
    positive_pct: float = 0
    negative_pct: float = 0
    neutral_pct: float = 0
    momentum_pct: Optional[float] = None
    momentum_direction: Literal["up", "down", "stable"] = "stable"
    risk_level: Literal["normal", "watch", "critical"] = "normal"
    main_theme: str = ""


class EmergingConversationItem(BaseModel):
    label: str
    growth_pct: float
    mentions: int = 0
    sentiment_label: str = "neutral"
    negative_pct: Optional[float] = None
    platforms: list[str] = []


class CleanTrendingTopicItem(BaseModel):
    name: str
    query: str = ""
    mentions: int = 0
    growth_pct: Optional[float] = None
    sentiment_label: str = ""
    positive_pct: float = 0
    platforms: list[str] = []


class YouTubePulseSummary(BaseModel):
    videos_count: int = 0
    comments_analyzed: int = 0
    total_views: int = 0
    creator_positive_pct: Optional[float] = None
    audience_positive_pct: Optional[float] = None
    top_theme: str = ""
    negative_theme: str = ""


class ComparisonSuggestion(BaseModel):
    label: str
    query_a: str
    query_b: str
    reason: str = ""


class BiggestMovers(BaseModel):
    sentiment: list[ChangeItem] = []
    volume: list[ChangeItem] = []


class DashboardIntelligence(BaseModel):
    kpis: DashboardKpiSummary
    todays_pulse: TodaysPulse
    needs_attention: list[AttentionItem] = []
    all_clear_message: Optional[str] = None
    since_last_visit: list[ChangeItem] = []
    grouped_recent_analyses: list[GroupedRecentAnalysis] = []
    weekly_activity: list[WeeklyActivityPoint] = []
    monitored_topics: list[MonitoredTopicRow] = []
    emerging_conversations: list[EmergingConversationItem] = []
    trending_topics_clean: list[CleanTrendingTopicItem] = []
    youtube_pulse: Optional[YouTubePulseSummary] = None
    biggest_movers: BiggestMovers = BiggestMovers()
    daily_brief: list[str] = []
    comparison_suggestions: list[ComparisonSuggestion] = []


class DashboardOverviewResponse(BaseModel):
    stats: DashboardStatsResponse
    trending_topics: list[TrendingTopicItem]
    debates: list[DebateItem]
    live_debates: list[LiveDebateItem] = []
    most_discussed: list[MostDiscussedItem] = []
    platform_pulse: list[PlatformPulseItem]
    demo_mode: bool = False
    is_live: dict[str, bool] = {}
    sources_summary: dict[str, int] = {}
    last_updated: Optional[str] = None
    intelligence: Optional[DashboardIntelligence] = None


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
