import type { SentimentLabel } from "@/lib/api/types"

export function sentimentLabelColor(label: SentimentLabel): string {
  switch (label) {
    case "positive":
      return "bg-green-100 text-green-800"
    case "negative":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-700"
  }
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
