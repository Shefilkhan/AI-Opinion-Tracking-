export interface SparklinePoint {
  day: string
  mentions: number
}

export interface TopicRow {
  id: string
  name: string
  mention_count: number
  sentiment_positive_pct: number
  sentiment_negative_pct: number
  direction: "up" | "down" | "flat"
  direction_pct: number
  is_heated_debate: boolean
  platforms: string[]
  platform_count: number
  sparkline_data: SparklinePoint[]
  last_updated: string
}

export type SortField = "engagement" | "sentiment" | "mentions" | "recent"
export type SortOrder = "asc" | "desc"
export type Timeframe = "24h" | "7d" | "30d"

export interface TopicsTableResponse {
  topics: TopicRow[]
  timeframe: Timeframe
}
