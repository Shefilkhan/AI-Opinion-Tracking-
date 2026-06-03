import { apiRequest } from "@/api/client"
import type { SearchFilters, SearchResponse } from "@/lib/api/types"
import { getClientMockSearch } from "@/lib/api/mock-data"
import { enrichSearchResponse } from "@/lib/api/sentiment"

export type { SearchFilters, SearchResponse }

export async function searchOpinions(
  query: string,
  filters: SearchFilters
): Promise<SearchResponse> {
  try {
    const data = await apiRequest<SearchResponse>("/api/search", {
      method: "POST",
      auth: true,
      body: {
        query,
        platform: filters.platform,
        time_range: filters.timeRange,
        sentiment: filters.sentiment,
        sort_by: filters.sortBy,
      },
    })
    return enrichSearchResponse(data)
  } catch {
    return enrichSearchResponse(getClientMockSearch(query))
  }
}

export async function fetchSearchHistory() {
  return apiRequest<{ items: SearchHistoryRow[] }>("/api/search/history", {
    auth: true,
  })
}

export type SearchHistoryRow = {
  id: string
  query: string
  results_count: number
  sentiment_positive?: number | null
  sentiment_negative?: number | null
  sentiment_neutral?: number | null
  searched_at: string
}
