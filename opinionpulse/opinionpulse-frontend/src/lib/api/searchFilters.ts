import type { SearchFilters, SearchResponse } from "@/lib/api/types"

function sentimentSummary(results: SearchResponse["results"]) {
  const total = results.length
  if (total === 0) {
    return { positive: 0, negative: 0, neutral: 100 }
  }
  const positive = results.filter((r) => r.sentiment === "positive").length
  const negative = results.filter((r) => r.sentiment === "negative").length
  const neutral = results.filter((r) => r.sentiment === "neutral").length
  return {
    positive: Math.round((positive / total) * 100),
    negative: Math.round((negative / total) * 100),
    neutral: Math.round((neutral / total) * 100),
  }
}

function sortResults(results: SearchResponse["results"], sortBy: string) {
  const sorted = [...results]
  if (sortBy === "mentioned") {
    sorted.sort(
      (a, b) =>
        b.engagement.likes +
        b.engagement.comments -
        (a.engagement.likes + a.engagement.comments)
    )
  } else if (sortBy === "viral") {
    sorted.sort(
      (a, b) =>
        b.engagement.likes +
        b.engagement.shares * 2 +
        (b.engagement.views ?? 0) / 100 -
        (a.engagement.likes +
          a.engagement.shares * 2 +
          (a.engagement.views ?? 0) / 100)
    )
  } else {
    sorted.sort(
      (a, b) =>
        new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
    )
  }
  return sorted
}

/** Apply sentiment + sort filters client-side without a new API call. */
export function applyClientFilters(
  data: SearchResponse,
  filters: SearchFilters
): SearchResponse {
  let results = [...data.results]

  if (filters.sentiment !== "all") {
    // Apply unconditionally; if nothing matches, let the empty-state render
    // rather than silently keeping the full (unfiltered) list.
    results = results.filter((r) => r.sentiment === filters.sentiment)
  }

  results = sortResults(results, filters.sortBy)

  return {
    ...data,
    results,
    total_results: results.length,
    sentiment_summary: sentimentSummary(results),
  }
}

export function needsServerRefetch(
  prev: SearchFilters | null,
  next: SearchFilters
): boolean {
  if (!prev) return true
  return (
    prev.platform !== next.platform || prev.timeRange !== next.timeRange
  )
}
