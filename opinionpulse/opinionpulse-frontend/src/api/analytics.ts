import { apiRequest } from "@/api/client"

export type AnalyticsOverview = {
  total_mentions: number
  total_analyzed: number
  positive: number
  neutral: number
  negative: number
  positive_percentage: number
  neutral_percentage: number
  negative_percentage: number
  average_score: number
  top_source: string | null
  top_sentiment: string | null
  keyword_count: number
}

export type SourceSentimentItem = {
  source: string
  total: number
  positive: number
  neutral: number
  negative: number
  average_score: number
}

export type SentimentDistributionItem = {
  label: string
  count: number
  percentage: number
}

export type TopMentionItem = {
  id: number
  source: string
  author: string | null
  text: string
  sentiment_label: string
  sentiment_score: number
  confidence: number
  url: string | null
}

export type TopMentionsResponse = {
  top_positive: TopMentionItem[]
  top_negative: TopMentionItem[]
}

export function getAnalyticsOverview(projectId: number) {
  return apiRequest<AnalyticsOverview>(
    `/api/projects/${projectId}/analytics/overview`,
    { auth: true }
  )
}

export function getSourceSentiment(projectId: number) {
  return apiRequest<SourceSentimentItem[]>(
    `/api/projects/${projectId}/analytics/source-sentiment`,
    { auth: true }
  )
}

export function getSentimentDistribution(projectId: number) {
  return apiRequest<SentimentDistributionItem[]>(
    `/api/projects/${projectId}/analytics/sentiment-distribution`,
    { auth: true }
  )
}

export function getTopMentions(projectId: number, limit = 5) {
  return apiRequest<TopMentionsResponse>(
    `/api/projects/${projectId}/analytics/top-mentions?limit=${limit}`,
    { auth: true }
  )
}
