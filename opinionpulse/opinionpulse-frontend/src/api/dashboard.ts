import { apiRequest } from "@/api/client"

export type DashboardOverview = {
  stats: {
    searches_today: StatCard
    topics_trending: StatCard
    positive_sentiment: StatCard & { progress?: number }
    negative_sentiment: StatCard & { progress?: number }
  }
  trending_topics: TrendingTopic[]
  debates: DebateItem[]
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
