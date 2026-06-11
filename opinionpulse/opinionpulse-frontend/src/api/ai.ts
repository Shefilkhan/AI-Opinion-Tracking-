import { apiRequest, ApiError } from "@/api/client"
import type { SearchResponse, SearchResultItem } from "@/lib/api/types"

const AI_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new ApiError(408, "AI request timed out")),
        ms
      )
    }),
  ])
}

export type AiOpinionSummary = {
  headline: string
  overview: string
  why_positive: string
  why_negative: string
  key_insight: string
  verdict: "overall_positive" | "overall_negative" | "deeply_divided" | "mostly_neutral"
  confidence: "high" | "medium" | "low"
  one_liner: string
}

export type AiDebateSide = {
  label: string
  strongest_argument: string
  supporting_points?: string[]
  opposing_points?: string[]
  who_believes_this: string
}

export type AiDebateAnalysis = {
  debate_title: string
  pro_side: AiDebateSide
  con_side: AiDebateSide
  middle_ground: string
  verdict: string
  winning_side: "pro" | "con" | "neither"
  debate_intensity: "low" | "medium" | "high" | "explosive"
  expert_take: string
}

export type AiTrendPrediction = {
  direction: string
  prediction: string
  confidence_level: number
  reasoning: string
  turning_point: string
  watch_for: string
  sentiment_momentum: string
  key_drivers: string[]
  risk_factors: string[]
  short_forecast: string
  platform_insight: string
}

export type AiInsightOfTheDay = {
  topic: string
  query: string
  headline: string
  overview: string
  one_liner: string
  verdict: string
}

function toAiPayloadResults(results: SearchResultItem[]) {
  return results.map((r) => ({
    platform: r.platform,
    title: r.title || r.content.slice(0, 120),
    content: r.content,
    sentiment: r.sentiment,
    posted_at: r.posted_at,
    source_url: r.source_url || r.url,
  }))
}

function aiPost<T>(path: string, body: unknown): Promise<T> {
  return withTimeout(
    apiRequest<T>(path, {
      method: "POST",
      body,
      auth: true,
    }),
    AI_TIMEOUT_MS
  )
}

export async function getAiStatus(): Promise<{ enabled: boolean }> {
  return apiRequest<{ enabled: boolean }>("/api/ai/status", { auth: true })
}

export async function fetchAiSummary(
  data: SearchResponse
): Promise<AiOpinionSummary> {
  const res = await aiPost<{ summary: AiOpinionSummary }>("/api/ai/summarize", {
    query: data.query,
    results: toAiPayloadResults(data.results),
    sentiment_summary: data.sentiment_summary,
  })
  return res.summary
}

export async function fetchAiDebate(
  data: SearchResponse
): Promise<AiDebateAnalysis> {
  const res = await aiPost<{ debate: AiDebateAnalysis }>("/api/ai/debate", {
    topic: data.query,
    results: toAiPayloadResults(data.results),
  })
  return res.debate
}

export async function fetchAiPrediction(
  data: SearchResponse,
  timeRange: string
): Promise<AiTrendPrediction> {
  const res = await aiPost<{ prediction: AiTrendPrediction }>("/api/ai/predict", {
    query: data.query,
    results: toAiPayloadResults(data.results),
    sentiment_summary: data.sentiment_summary,
    time_range: timeRange,
  })
  return res.prediction
}

export async function getAiInsightOfTheDay(): Promise<{
  enabled: boolean
  insight: AiInsightOfTheDay | null
}> {
  return apiRequest<{
    enabled: boolean
    insight: AiInsightOfTheDay | null
  }>("/api/ai/insight-of-the-day", { auth: true })
}

export type AiCrisisResponse = {
  severity_assessment: string
  core_issue: string
  pr_statement: string
  suggested_tweet: string
  dos: string[]
  donts: string[]
}

export async function generateCrisisResponse(data: { topic: string; results: any[] }): Promise<{ response: AiCrisisResponse; ai_enabled: boolean }> {
  return apiRequest<{ response: AiCrisisResponse; ai_enabled: boolean }>("/api/ai/crisis-response", {
    method: "POST",
    body: data,
    auth: true,
  })
}
