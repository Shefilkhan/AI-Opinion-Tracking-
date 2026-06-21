import { apiRequest } from "@/api/client"

export type PublicDemoResult = {
  id: string
  platform: string
  author: string
  content: string
  title?: string
  sentiment: "positive" | "negative" | "neutral"
  sentiment_score: number
  engagement: {
    likes: number
    shares: number
    comments: number
    views?: number
  }
  posted_at: string
}

export type PublicDemoResponse = {
  results: PublicDemoResult[]
  is_demo: boolean
  sources_searched: string[]
  query: string
  total_results: number
  sentiment_summary?: {
    positive: number
    negative: number
    neutral: number
  }
}

export async function fetchPublicDemoSearch(query: string): Promise<PublicDemoResponse> {
  const params = new URLSearchParams({ q: query.trim() })
  return apiRequest<PublicDemoResponse>(`/api/search/public-demo?${params.toString()}`)
}
