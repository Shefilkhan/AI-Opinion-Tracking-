export type SentimentLabel = "positive" | "negative" | "neutral"

export type RiskLevel = "low" | "mild" | "average" | "high"
export type SentimentIntensity = "low" | "medium" | "high"
export type ContentType = "comment" | "post" | "reel" | "image"
export type AgeGroup = "kids" | "teen" | "adult"

export type RiskRationale = {
  primary_reason: string
  contributing_factors: string[]
}

export type RiskProfile = {
  content_type: ContentType
  sentiment: SentimentLabel
  sentiment_intensity: SentimentIntensity
  age_group: AgeGroup
  social_media_usage_hours: number
  risk_level: RiskLevel
  risk_rationale: RiskRationale
  composite_score: number
  ai_enabled: boolean
}
export type SearchFilters = {
  platform: string
  timeRange: string
  sentiment: string
  sortBy: string
}

export type SentimentDetail = {
  direction: SentimentLabel
  intensity: SentimentIntensity
  label: string
  score: number
}

export type AgeAnalysis = {
  distribution: Record<string, number>
  dominant_group: string
  label: string
}

export type UsageContextItem = {
  age_group: string
  avg_daily_hours: number
  typical_range: string
  usage_risk: string
}

export type TopicRiskAssessment = {
  level: "mild" | "average" | "high"
  label: string
  score: number
  max_score: number
  score_pct: number
  description: string
  color: string
  risk_factors: string[]
}

export type SearchResultItem = {
  id: string
  platform: string
  author: string
  content: string
  title?: string | null
  source_label?: string | null
  thumbnail?: string | null
  sentiment: SentimentLabel
  sentiment_score: number
  sentiment_detail?: SentimentDetail
  content_type?: string
  engagement: { likes: number; shares: number; comments: number; views?: number }
  url: string
  source_url?: string
  publication?: string
  image_url?: string | null
  posted_at: string
  is_demo?: boolean
}

export type WikiSummary = {
  title: string
  summary: string
  url: string
  thumbnail?: string | null
}

export type SentimentForecastPoint = {
  date: string
  predicted_score: number
  sentiment: "positive" | "negative" | "neutral"
  estimated_volume: number
}

export type SearchResponse = {
  query: string
  total_results: number
  sentiment_summary: {
    positive: number
    negative: number
    neutral: number
  }
  platforms_searched: string[]
  platforms_live: Record<string, boolean>
  apis_configured: Record<string, boolean>
  demo_mode: boolean
  peak_discussion: string | null
  most_active_platform: string | null
  results: SearchResultItem[]
  trending_keywords: { word: string; count: number }[]
  related_topics: string[]
  sentiment_trend: {
    time: string
    positive: number
    negative: number
    neutral: number
    volume?: number
  }[]
  sentiment_forecast: SentimentForecastPoint[]
  last_updated: string
  age_analysis?: AgeAnalysis | null
  usage_context?: UsageContextItem[] | null
  risk_assessment?: TopicRiskAssessment | null
  wiki_summary: {
    title: string
    extract: string
    url: string
  } | null
  errors: string[] | null
  locked_sources?: string[]
  upgrade_message?: string | null
  source_health?: Record<
    string,
    { status: string; count: number; message?: string }
  >
  data_freshness?: {
    fetched_at: string
    sources_used: number
    sources_failed: number
  }
  relevance_mode?: string
}
