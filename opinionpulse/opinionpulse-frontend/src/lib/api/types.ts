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
  sentiment: SentimentLabel
  sentiment_score: number
  engagement: { likes: number; shares: number; comments: number }
  url: string
  posted_at: string
}

export type SearchResponse = {
  query: string
  total_results: number
  sentiment_summary: { positive: number; negative: number; neutral: number }
  platforms_searched: string[]
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
}
