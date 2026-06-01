import { apiRequest } from "@/api/client"

export type RecentProject = {
  id: number
  name: string
  mentions_count: number
  keywords_count: number
  positive_percentage: number
  negative_percentage: number
}

export type LatestSentiment = {
  project_id: number
  project_name: string
  positive: number
  neutral: number
  negative: number
  average_score: number
}

export type DashboardSummary = {
  total_projects: number
  total_mentions: number
  total_analyzed: number
  total_reports: number
  recent_projects: RecentProject[]
  latest_sentiment: LatestSentiment | null
}

export type TrendingItem = {
  title: string
  source: string
  url: string | null
  published_at: string | null
  suggested_keyword: string
}

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>("/api/dashboard/summary", { auth: true })
}

export function getDashboardTrending() {
  return apiRequest<{ items: TrendingItem[]; message: string }>(
    "/api/dashboard/trending",
    { auth: true }
  )
}
