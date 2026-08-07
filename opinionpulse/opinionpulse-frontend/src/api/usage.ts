export type UsageMetric = {
  used: number
  limit: number
  percent: number | null
}

export type UsageFeatures = {
  data_sources: string[] | "all"
  ai_opinion_summary: boolean
  ai_debate_analysis: boolean
  ai_trend_prediction: boolean
  api_access: boolean
  search_history_days: number
  chat_history_days: number
}

export type BillingSummary = {
  available: boolean
  renews_at: string | null
}

export type UsageStatus = {
  plan: { id: string; name: string; status: string }
  usage: {
    searches: UsageMetric
    chat_messages_today: UsageMetric
    csv_exports: { used: number; limit: number }
  }
  period: { start: string; end: string }
  features: UsageFeatures
  billing: BillingSummary
}
