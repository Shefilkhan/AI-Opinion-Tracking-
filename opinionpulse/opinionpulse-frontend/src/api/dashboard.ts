import { apiRequest } from "@/api/client"

export type SentimentSplit = {
  positive: number
  negative: number
  neutral: number
}

export type LiveDebateItem = {
  topic: string
  headline: string
  summary: string
  source_url?: string
  source_label?: string
  thumbnail?: string | null
  platforms: string[]
  total_mentions: number
  total_engagement?: number
  sentiment: SentimentSplit
  is_heated: boolean
  posted_at?: string
  time_ago: string
}

export type MostDiscussedItem = {
  topic: string
  query?: string
  emoji: string
  total_mentions: number
  total_engagement: number
  sentiment: SentimentSplit
  top_platform: string
  platform_breakdown: Record<string, number>
  trend: "up" | "down" | "stable"
}

export type PlatformPulse = {
  platform: string
  label: string
  mentions: string
  positive_pct: number
  live?: boolean
  mention_count?: number
  activity_change_pct?: number | null
  sentiment_net?: number | null
}

export type AttentionItem = {
  severity: "critical" | "warning" | "info"
  topic: string
  watch_id?: string | null
  headline: string
  detail?: string
  main_issue?: string
  main_source?: string
  action_label?: string
  action_href?: string
}

export type ChangeItem = {
  topic: string
  metric: string
  change: string
  direction: "up" | "down" | "stable"
}

export type GroupedRecentAnalysis = {
  query: string
  search_count_today: number
  latest_results_count: number
  latest_sentiment_net?: number | null
  last_searched_at: string
}

export type WeeklyActivityPoint = {
  day: string
  mentions: number
  positive_pct: number
  negative_pct: number
  neutral_pct: number
}

export type MonitoredTopicRow = {
  watch_id: string
  name: string
  query: string
  mention_count: number
  sentiment_label: string
  positive_pct: number
  negative_pct: number
  neutral_pct: number
  momentum_pct?: number | null
  momentum_direction: "up" | "down" | "stable"
  risk_level: "normal" | "watch" | "critical"
  main_theme?: string
}

export type EmergingConversation = {
  label: string
  growth_pct: number
  mentions: number
  sentiment_label: string
  negative_pct?: number | null
  platforms: string[]
}

export type CleanTrendingTopic = {
  name: string
  query?: string
  mentions: number
  growth_pct?: number | null
  sentiment_label: string
  positive_pct: number
  platforms: string[]
}

export type YouTubePulseSummary = {
  videos_count: number
  comments_analyzed: number
  total_views: number
  creator_positive_pct?: number | null
  audience_positive_pct?: number | null
  top_theme?: string
  negative_theme?: string
}

export type DashboardIntelligence = {
  kpis: {
    monitored_topics: number
    alerts_count: number
    avg_sentiment_label: string
    avg_positive_pct: number
    sentiment_change_pp?: number | null
    content_analyzed: number
    sources_live: number
    sources_total: number
    top_source: string
  }
  todays_pulse: {
    items_analyzed: number
    positive_pct: number
    neutral_pct: number
    negative_pct: number
    activity_change_pct?: number | null
    top_source: string
    sources_live: number
    sources_total: number
  }
  needs_attention: AttentionItem[]
  all_clear_message?: string | null
  since_last_visit: ChangeItem[]
  grouped_recent_analyses: GroupedRecentAnalysis[]
  weekly_activity: WeeklyActivityPoint[]
  monitored_topics: MonitoredTopicRow[]
  emerging_conversations: EmergingConversation[]
  trending_topics_clean: CleanTrendingTopic[]
  youtube_pulse?: YouTubePulseSummary | null
  biggest_movers: { sentiment: ChangeItem[]; volume: ChangeItem[] }
  daily_brief: string[]
  comparison_suggestions: { label: string; query_a: string; query_b: string; reason?: string }[]
}

export type DashboardOverview = {
  stats: {
    searches_today: StatCard
    topics_trending: StatCard
    positive_sentiment: StatCard & { progress?: number }
    negative_sentiment: StatCard & { progress?: number }
  }
  trending_topics: TrendingTopic[]
  debates: DebateItem[]
  live_debates: LiveDebateItem[]
  most_discussed: MostDiscussedItem[]
  platform_pulse: PlatformPulse[]
  demo_mode: boolean
  is_live: Record<string, boolean>
  sources_summary?: { live: number; configured: number; total: number }
  last_updated?: string | null
  intelligence?: DashboardIntelligence | null
}

export type TrendingTopic = {
  name: string
  mentions: string
  sentiment: "positive" | "negative" | "mixed"
  trend: "up" | "down"
  query?: string
}

export type DebateItem = {
  id: string
  title: string
  platform: string
  summary: string
  positive_pct: number
  negative_pct: number
  neutral_pct?: number
  time_ago: string
  query: string
  source_url?: string
  source_label?: string
  thumbnail?: string | null
}

type StatCard = {
  value: string
  subtitle: string
  trend: string
  trend_positive: boolean
  progress?: number
}

export async function getDashboardOverview(options?: {
  timeoutMs?: number
}): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>("/api/dashboard/overview", {
    auth: true,
    timeoutMs: options?.timeoutMs,
  })
}

export async function getLiveDebates(options?: {
  timeoutMs?: number
}): Promise<LiveDebateItem[]> {
  return apiRequest<LiveDebateItem[]>("/api/dashboard/debates", {
    auth: true,
    timeoutMs: options?.timeoutMs,
  })
}

export async function getMostDiscussed(): Promise<MostDiscussedItem[]> {
  return apiRequest<MostDiscussedItem[]>("/api/dashboard/most-discussed", {
    auth: true,
  })
}

export async function getTopicsTable(params: {
  sortBy: string
  sortOrder: string
  timeframe: string
}) {
  const qs = new URLSearchParams({
    sort_by: params.sortBy,
    sort_order: params.sortOrder,
    timeframe: params.timeframe,
  })
  return apiRequest<import("@/types/dashboard").TopicsTableResponse>(
    `/api/dashboard/topics-table?${qs.toString()}`,
    { auth: true }
  )
}
