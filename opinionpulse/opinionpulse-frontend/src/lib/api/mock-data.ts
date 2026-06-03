import type { SearchResponse } from "@/lib/api/types"

/** Client-side fallback if API is unreachable */
export function getClientMockSearch(query: string): SearchResponse {
  return {
    query,
    total_results: 47293,
    sentiment_summary: { positive: 72, negative: 13, neutral: 15 },
    platforms_searched: ["twitter", "reddit", "youtube", "news"],
    demo_mode: true,
    peak_discussion: "Today at 2:00 PM",
    most_active_platform: "twitter",
    results: [],
    trending_keywords: [
      { word: "innovation", count: 8421 },
      { word: "debate", count: 6291 },
    ],
    related_topics: ["#Trending", "#News"],
    sentiment_trend: [],
  }
}
