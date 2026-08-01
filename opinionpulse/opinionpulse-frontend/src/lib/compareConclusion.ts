import type { SearchResponse, TopicSummary } from "@/lib/api/types"

export type CompareConclusion = {
  headline: string
  paragraphs: string[]
  volume_leader: string | null
  sentiment_leader: string | null
}

function label(data: SearchResponse): string {
  return data.topic_summary?.query ?? data.query
}

function mentions(data: SearchResponse): number {
  return data.topic_summary?.total_mentions ?? data.total_results
}

function sentimentPct(data: SearchResponse, key: "positive" | "negative" | "neutral"): number {
  return Math.round(data.sentiment_summary[key] ?? 0)
}

function tone(data: SearchResponse): string {
  return data.topic_summary?.sentiment_tone ?? "mixed"
}

function platformLabel(name: string | null | undefined): string {
  if (!name) return "unknown source"
  const labels: Record<string, string> = {
    reddit: "Reddit",
    youtube: "YouTube",
    newsapi: "News",
    hackernews: "Hacker News",
    devto: "Dev.to",
    github: "GitHub",
    stackoverflow: "Stack Overflow",
    bluesky: "Bluesky",
    mastodon: "Mastodon",
  }
  return labels[name.toLowerCase()] ?? name.replace(/_/g, " ")
}

/** Rule-based comparison — derived only from authenticated search API payloads. */
export function buildCompareConclusion(
  dataA: SearchResponse,
  dataB: SearchResponse
): CompareConclusion {
  const nameA = label(dataA)
  const nameB = label(dataB)
  const countA = mentions(dataA)
  const countB = mentions(dataB)

  const posA = sentimentPct(dataA, "positive")
  const posB = sentimentPct(dataB, "positive")
  const negA = sentimentPct(dataA, "negative")
  const negB = sentimentPct(dataB, "negative")
  const neuA = sentimentPct(dataA, "neutral")
  const neuB = sentimentPct(dataB, "neutral")

  const paragraphs: string[] = []

  if (countA === 0 && countB === 0) {
    return {
      headline: "Insufficient live data for a comparison",
      paragraphs: [
        `Neither "${nameA}" nor "${nameB}" returned mentions in the last 24 hours. Try a wider time range or broader keywords.`,
      ],
      volume_leader: null,
      sentiment_leader: null,
    }
  }

  let volumeLeader: string | null = null
  if (countA !== countB) {
    volumeLeader = countA > countB ? nameA : nameB
    const leaderCount = Math.max(countA, countB)
    const trailingCount = Math.min(countA, countB)
    const trailingName = countA > countB ? nameB : nameA
    const pct =
      trailingCount === 0
        ? 100
        : Math.round(((leaderCount - trailingCount) / trailingCount) * 100)
    paragraphs.push(
      `${volumeLeader} generated more conversation with ${leaderCount.toLocaleString()} mentions versus ${trailingCount.toLocaleString()} for ${trailingName}${pct > 0 ? ` (~${pct}% more volume)` : ""}.`
    )
  } else {
    paragraphs.push(
      `Both topics saw similar mention volume (${countA.toLocaleString()} each) in the last 24 hours.`
    )
  }

  let sentimentLeader: string | null = null
  if (Math.abs(posA - posB) >= 5) {
    sentimentLeader = posA > posB ? nameA : nameB
    const leaderPos = Math.max(posA, posB)
    const trailingPos = Math.min(posA, posB)
    const trailingName = posA > posB ? nameB : nameA
    paragraphs.push(
      `${sentimentLeader} carries a more positive tone (${leaderPos}% positive vs ${trailingPos}% for ${trailingName}).`
    )
  } else if (Math.abs(negA - negB) >= 5) {
    const lowerNeg = negA < negB ? nameA : nameB
    sentimentLeader = lowerNeg
    paragraphs.push(
      `${lowerNeg} has lower negative sentiment (${Math.min(negA, negB)}% vs ${Math.max(negA, negB)}%).`
    )
  } else {
    paragraphs.push(
      `Sentiment profiles are close: ${nameA} is ${tone(dataA)} (${posA}% positive) and ${nameB} is ${tone(dataB)} (${posB}% positive).`
    )
  }

  if (Math.abs(neuA - neuB) >= 12) {
    const moreNeutral = neuA > neuB ? nameA : nameB
    paragraphs.push(
      `${moreNeutral} skews more neutral (${Math.max(neuA, neuB)}% neutral mentions).`
    )
  }

  if (dataA.most_active_platform && dataB.most_active_platform) {
    const platA = platformLabel(dataA.most_active_platform)
    const platB = platformLabel(dataB.most_active_platform)
    if (platA !== platB) {
      paragraphs.push(
        `Conversation hubs differ: ${nameA} is strongest on ${platA}, while ${nameB} leads on ${platB}.`
      )
    }
  }

  const kwA = new Set((dataA.topic_summary?.top_keywords ?? []).slice(0, 5))
  const kwB = new Set((dataB.topic_summary?.top_keywords ?? []).slice(0, 5))
  const uniqueA = [...kwA].filter((k) => !kwB.has(k)).slice(0, 3)
  const uniqueB = [...kwB].filter((k) => !kwA.has(k)).slice(0, 3)
  if (uniqueA.length || uniqueB.length) {
    const parts: string[] = []
    if (uniqueA.length) parts.push(`${nameA}: ${uniqueA.map((k) => `#${k}`).join(", ")}`)
    if (uniqueB.length) parts.push(`${nameB}: ${uniqueB.map((k) => `#${k}`).join(", ")}`)
    paragraphs.push(`Distinct themes — ${parts.join(" · ")}.`)
  }

  const headline =
    volumeLeader && sentimentLeader && volumeLeader === sentimentLeader
      ? `${volumeLeader} leads on both volume and sentiment`
      : volumeLeader
        ? `${volumeLeader} is the louder topic right now`
        : `Comparing "${nameA}" vs "${nameB}"`

  return {
    headline,
    paragraphs,
    volume_leader: volumeLeader,
    sentiment_leader: sentimentLeader,
  }
}

/** Fallback summary text when backend topic_summary is missing (older API). */
export function fallbackTopicOverview(data: SearchResponse): string | null {
  const parts: string[] = []
  const wiki = data.wiki_summary?.summary ?? data.wiki_summary?.extract
  if (wiki) parts.push(wiki.trim())

  if (data.total_results > 0) {
    const pos = sentimentPct(data, "positive")
    const neu = sentimentPct(data, "neutral")
    const neg = sentimentPct(data, "negative")
    parts.push(
      `${data.total_results.toLocaleString()} mentions in the last 24 hours. Sentiment: ${pos}% positive, ${neu}% neutral, ${neg}% negative.`
    )
  }
  return parts.length ? parts.join("\n\n") : null
}

export function hasTopicSummary(data: SearchResponse): data is SearchResponse & {
  topic_summary: TopicSummary
} {
  return Boolean(data.topic_summary?.overview)
}
