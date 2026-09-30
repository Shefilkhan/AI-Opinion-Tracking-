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
  language: string
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
  metadata?: {
    video_id?: string
    channel_id?: string
    channel_name?: string
    video_title?: string
    parent_comment_id?: string
    audience_role?: "creator" | "audience"
    type?: string
  }
}

export type SearchInsight = {
  type: string
  severity: "info" | "positive" | "warning" | "critical"
  title: string
  description: string
  metric?: number
}

export type ContentBreakdown = {
  primary: number
  comments: number
  replies: number
  total: number
}

export type CoverageConfidence = {
  level: "high" | "medium" | "low"
  label: string
  explanation: string
  total_items: number
  active_sources: number
  platform_types: number
}

export type PlatformStatItem = {
  platform: string
  content_count: number
  share_pct: number
  primary: number
  comments: number
  replies: number
  sentiment: { positive: number; neutral: number; negative: number }
  engagement_level: string
}

export type ThemeItem = {
  name: string
  label: string
  count: number
  mentions: number
  sentiment: { positive: number; neutral: number; negative: number }
  dominant_sentiment: string
}

export type PeriodComparison = {
  current_volume: number
  previous_volume: number
  volume_change_pct: number
  momentum: "rising" | "stable" | "declining"
  negative_change_pp: number
}

export type SearchIntelligence = {
  content_breakdown: ContentBreakdown
  analyzed_total: number
  displayed_count: number
  confidence: CoverageConfidence
  platform_stats: PlatformStatItem[]
  themes: ThemeItem[]
  most_negative_theme?: ThemeItem | null
  most_positive_theme?: ThemeItem | null
  insights: SearchInsight[]
  period_comparison?: PeriodComparison | null
  emerging_topics: {
    label: string
    growth_pct: number
    recent_count: number
    direction: string
  }[]
  influential_content: SearchResultItem[]
  why_sentiment_changed?: {
    negative_change_pp: number
    previous_negative_pct: number
    current_negative_pct: number
    negative_contributors: { label: string; mentions: number; negative_pct: number }[]
    positive_offset: { label: string; mentions: number; positive_pct: number }[]
  } | null
  leading_platform?: PlatformStatItem | null
}

export type SearchTab = "overview" | "platforms" | "youtube" | "trends" | "results"

export type YouTubeSentimentBreakdown = {
  positive: number
  negative: number
  neutral: number
}

export type YouTubeThemeItem = {
  label: string
  count: number
}

export type YouTubeThemeSentiment = {
  label: string
  mentions: number
  positive: number
  neutral: number
  negative: number
}

export type YouTubeSummary = {
  platform: string
  videos_analyzed: number
  comments_analyzed: number
  replies_analyzed: number
  total_views: number
  total_likes: number
  total_comments: number
  creator_sentiment: YouTubeSentimentBreakdown
  audience_sentiment: YouTubeSentimentBreakdown
  engagement_weighted_audience_sentiment: YouTubeSentimentBreakdown
  top_themes: YouTubeThemeItem[]
  theme_sentiment: YouTubeThemeSentiment[]
  engagement_weight_formula: string
}

export type WikiSummary = {
  title: string
  summary: string
  extract?: string
  url: string
  thumbnail?: string | null
}

export type TopicSummary = {
  query: string
  overview: string
  highlights: string[]
  top_keywords: string[]
  sentiment_tone: string
  total_mentions: number
  sources_count: number
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
  wiki_summary: WikiSummary | null
  topic_summary?: TopicSummary | null
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
  search_metadata?: {
    spam_filtered: number
    non_english_filtered: number
    brand_noise_filtered: number
    youtube_comments_included: number
    youtube_replies_included?: number
    youtube_videos_with_comments?: number
  }
  youtube_summary?: YouTubeSummary | null
  search_intelligence?: SearchIntelligence | null
}
