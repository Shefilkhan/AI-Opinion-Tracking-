import type { SearchResponse, SearchResultItem, SentimentLabel } from "@/lib/api/types"

const POSITIVE_WORDS = [
  "good",
  "great",
  "excellent",
  "amazing",
  "awesome",
  "fantastic",
  "love",
  "best",
  "incredible",
  "outstanding",
  "brilliant",
  "perfect",
  "happy",
  "excited",
  "growth",
  "profit",
  "win",
  "success",
  "bullish",
  "up",
  "rise",
  "gain",
  "positive",
  "strong",
  "boom",
  "surge",
  "innovation",
  "revolutionary",
  "promising",
  "optimistic",
  "support",
  "milestone",
  "record",
  "adoption",
  "trusted",
  "secure",
  "future",
]

const NEGATIVE_WORDS = [
  "bad",
  "terrible",
  "awful",
  "horrible",
  "worst",
  "hate",
  "scam",
  "fraud",
  "crash",
  "fail",
  "failure",
  "loss",
  "bearish",
  "down",
  "drop",
  "fall",
  "decline",
  "negative",
  "weak",
  "bust",
  "collapse",
  "risk",
  "danger",
  "problem",
  "issue",
  "concern",
  "worried",
  "fear",
  "panic",
  "bubble",
  "volatile",
  "unstable",
  "ban",
  "illegal",
  "hack",
  "stolen",
  "lost",
  "debt",
  "crisis",
  "warning",
  "threat",
  "dump",
  "disaster",
  "dangerous",
  "compromised",
]

export type SentimentAnalysis = {
  sentiment: SentimentLabel
  score: number
}

export function analyzeSentiment(text: string): SentimentAnalysis {
  const words = text.toLowerCase().split(/\s+/)
  let positiveCount = 0
  let negativeCount = 0

  words.forEach((word) => {
    const cleanWord = word.replace(/[^a-z]/g, "")
    if (!cleanWord) return
    if (POSITIVE_WORDS.includes(cleanWord)) positiveCount++
    if (NEGATIVE_WORDS.includes(cleanWord)) negativeCount++
  })

  const total = positiveCount + negativeCount
  if (total === 0) return { sentiment: "neutral", score: 0 }

  const score = (positiveCount - negativeCount) / total

  if (score > 0.1) return { sentiment: "positive", score }
  if (score < -0.1) return { sentiment: "negative", score }
  return { sentiment: "neutral", score }
}

export function calculateSentimentSummary(results: SearchResultItem[]): {
  positive: number
  negative: number
  neutral: number
} {
  const total = results.length
  if (total === 0) return { positive: 0, negative: 0, neutral: 100 }

  const positive = results.filter((r) => r.sentiment === "positive").length
  const negative = results.filter((r) => r.sentiment === "negative").length
  const neutral = results.filter((r) => r.sentiment === "neutral").length

  return {
    positive: Math.round((positive / total) * 100),
    negative: Math.round((negative / total) * 100),
    neutral: Math.round((neutral / total) * 100),
  }
}

export function applySentimentToResults(
  results: SearchResultItem[]
): SearchResultItem[] {
  return results.map((r) => {
    const { sentiment, score } = analyzeSentiment(r.content)
    return { ...r, sentiment, sentiment_score: score }
  })
}

/** Re-score results and rebuild summary so UI always matches content. */
export function enrichSearchResponse(data: SearchResponse): SearchResponse {
  const results = applySentimentToResults(data.results)
  const sentiment_summary = calculateSentimentSummary(results)
  return { ...data, results, sentiment_summary }
}

export function sentimentBadgeClass(label: SentimentLabel): string {
  switch (label) {
    case "positive":
      return "bg-green-100 text-green-700"
    case "negative":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

export function sentimentBadgeLabel(label: SentimentLabel): string {
  switch (label) {
    case "positive":
      return "✓ Positive"
    case "negative":
      return "✗ Negative"
    default:
      return "— Neutral"
  }
}

export function sentimentLabelColor(label: SentimentLabel): string {
  return sentimentBadgeClass(label)
}

export function formatSentimentPct(value: number): string {
  return `${Math.round(value)}%`
}

export function platformDisplayName(platform: string): string {
  const map: Record<string, string> = {
    twitter: "Twitter/X",
    reddit: "Reddit",
    youtube: "YouTube",
    news: "News",
  }
  return map[platform] ?? platform
}

export type PlatformBadgeStyle = {
  label: string
  className: string
  icon: string
}

export function platformBadge(platform: string): PlatformBadgeStyle {
  switch (platform) {
    case "twitter":
      return {
        label: "Twitter/X",
        className: "bg-black text-white",
        icon: "𝕏",
      }
    case "reddit":
      return {
        label: "Reddit",
        className: "bg-orange-500 text-white",
        icon: "R",
      }
    case "youtube":
      return {
        label: "YouTube",
        className: "bg-red-600 text-white",
        icon: "▶",
      }
    case "news":
      return {
        label: "News",
        className: "bg-blue-600 text-white",
        icon: "📰",
      }
    default:
      return {
        label: platformDisplayName(platform),
        className: "bg-gray-600 text-white",
        icon: "•",
      }
  }
}
