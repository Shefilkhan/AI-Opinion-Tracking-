import { apiRequest, ApiError } from "@/api/client"
import type { SearchResponse, SearchResultItem, RiskProfile } from "@/lib/api/types"

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
  verdict: string
  sentiment_score: number
  top_positive_driver: string
  top_negative_driver: string
  most_discussed_angle: string
  trend: "rising" | "falling" | "stable"
  confidence: "high" | "medium" | "low"
}

export type AiDebateSide = {
  label: string
  strength: string
  top_argument: string
}

export type AiDebateAnalysis = {
  topic: string
  debate_intensity: "low" | "medium" | "heated" | "explosive"
  side_a: AiDebateSide
  side_b: AiDebateSide
  who_is_winning: "side_a" | "side_b" | "tied"
  winning_reason: string
}

export type AiTrendPrediction = {
  direction: "rising" | "falling" | "stable" | "volatile"
  momentum: "accelerating" | "decelerating" | "steady"
  "7_day_forecast": string
  key_driver: string
  leading_platform: string
  confidence_pct: number
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

export async function generateCrisisResponse(data: { topic: string; results: SearchResultItem[] }): Promise<{ response: AiCrisisResponse; ai_enabled: boolean }> {
  return apiRequest<{ response: AiCrisisResponse; ai_enabled: boolean }>("/api/ai/crisis-response", {
    method: "POST",
    body: data,
    auth: true,
  })
}

/**
 * Analyse a single social-media content item and get structured risk signals
 * plus a deterministic risk level computed server-side.
 *
 * @param content                 The text of the post / comment / caption to analyse.
 * @param socialMediaUsageHours   Estimated daily hours the subject spends on social media.
 *                                Omit to let the server apply the default (3 h).
 */
export async function fetchRiskAnalysis(
  content: string,
  socialMediaUsageHours?: number
): Promise<RiskProfile> {
  return withTimeout(
    apiRequest<RiskProfile>("/api/ai/risk-analysis", {
      method: "POST",
      body: {
        content,
        social_media_usage_hours: socialMediaUsageHours ?? null,
      },
      auth: true,
    }),
    AI_TIMEOUT_MS
  )
}

export type RiskCompareItem = {
  topic: string
  risk_level: string
  risk_label: string
  risk_score: number
  risk_score_pct: number
  risk_factors: string[]
  sentiment: Record<string, number>
  dominant_age: string
  description: string
}

export async function compareTopicRisks(topics: string[]): Promise<{
  comparison: RiskCompareItem[]
  highest_risk: string
  lowest_risk: string
}> {
  return aiPost("/api/risk/compare", { topics })
}
