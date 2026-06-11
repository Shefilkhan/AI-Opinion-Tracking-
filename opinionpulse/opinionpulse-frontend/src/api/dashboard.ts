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
  last_updated?: string | null
}

type StatCard = {
  value: string
  subtitle: string
  trend: string
  trend_positive: boolean
  progress?: number
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
  time_ago: string
  query: string
  source_url?: string
  source_label?: string
  thumbnail?: string | null
}

export type PlatformPulse = {
  platform: string
  label: string
  mentions: string
  positive_pct: number
  live?: boolean
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>("/api/dashboard/overview", { auth: true })
}

export async function getLiveDebates(): Promise<LiveDebateItem[]> {
  return apiRequest<LiveDebateItem[]>("/api/dashboard/debates", { auth: true })
}

export async function getMostDiscussed(): Promise<MostDiscussedItem[]> {
  return apiRequest<MostDiscussedItem[]>("/api/dashboard/most-discussed", {
    auth: true,
  })
}
