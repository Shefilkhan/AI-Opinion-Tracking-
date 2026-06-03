export type SentimentLabel = "positive" | "negative" | "neutral"

export type SearchFilters = {
  platform: string
  timeRange: string
  sentiment: string
  sortBy: string
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

export type SearchResponse = {
  query: string
  total_results: number
  sentiment_summary: { positive: number; negative: number; neutral: number }
  platforms_searched: string[]
  platforms_live?: Record<string, boolean>
  apis_configured?: Record<string, boolean>
  wiki_summary?: WikiSummary | null
  errors?: string[] | null
  demo_mode: boolean
  peak_discussion?: string | null
  most_active_platform?: string | null
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
  last_updated?: string | null
}
