import { apiRequest } from "@/api/client"

export type SentimentBrief = {
  sentiment_label: "positive" | "negative" | "neutral"
  sentiment_score: number
  confidence: number
  model_name: string
}

export type SentimentSummary = {
  total_analyzed: number
  positive: number
  neutral: number
  negative: number
  positive_percentage: number
  neutral_percentage: number
  negative_percentage: number
  average_score: number
}

export type SentimentTrendItem = {
  date: string
  positive: number
  neutral: number
  negative: number
  average_score: number
}

export type AnalyzeProjectResponse = {
  analyzed: number
  positive: number
  neutral: number
  negative: number
  message?: string
}

export function analyzeProjectSentiment(projectId: number) {
  return apiRequest<AnalyzeProjectResponse>(
    `/api/projects/${projectId}/sentiment/analyze`,
    { method: "POST", auth: true }
  )
}

export function analyzeMentionSentiment(mentionId: number) {
  return apiRequest<SentimentBrief & { id: number; mention_id: number; analyzed_at: string }>(
    `/api/mentions/${mentionId}/sentiment/analyze`,
    { method: "POST", auth: true }
  )
}

export function getProjectSentimentSummary(projectId: number) {
  return apiRequest<SentimentSummary>(
    `/api/projects/${projectId}/sentiment/summary`,
    { auth: true }
  )
}

export function getProjectSentimentTrends(projectId: number) {
  return apiRequest<{ trends: SentimentTrendItem[] }>(
    `/api/projects/${projectId}/sentiment/trends`,
    { auth: true }
  )
}

export function getMentionSentiment(mentionId: number) {
  return apiRequest<SentimentBrief & { id: number; mention_id: number; analyzed_at: string }>(
    `/api/mentions/${mentionId}/sentiment`,
    { auth: true }
  )
}
