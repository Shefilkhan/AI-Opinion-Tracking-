import type { SearchResponse, ThemeItem } from "@/lib/api/types"
import { platformDisplayName } from "@/lib/api/sentiment"
import { buildCompareConclusion } from "@/lib/compareConclusion"

export type CompareTab = "overview" | "sentiment" | "platforms" | "themes" | "trends" | "sources"

export const COMPARE_TABS: { id: CompareTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sentiment", label: "Sentiment" },
  { id: "platforms", label: "Platforms" },
  { id: "themes", label: "Themes" },
  { id: "trends", label: "Trends" },
  { id: "sources", label: "Sources" },
]

const STOPWORDS = new Set([
  "what",
  "using",
  "show",
  "create",
  "course",
  "native",
  "game",
  "video",
  "with",
  "from",
  "that",
  "this",
  "have",
  "your",
  "about",
  "into",
  "they",
  "their",
  "there",
  "when",
  "where",
  "which",
  "would",
  "could",
  "should",
  "just",
  "also",
  "more",
  "some",
  "very",
  "like",
  "make",
  "made",
  "been",
  "being",
  "will",
  "does",
  "did",
  "are",
  "was",
  "were",
  "has",
  "had",
  "not",
  "but",
  "for",
  "and",
  "the",
  "you",
  "how",
  "why",
  "can",
  "all",
  "new",
  "get",
  "use",
  "one",
  "two",
])

export function topicLabel(data: SearchResponse): string {
  return data.topic_summary?.query ?? data.query
}

export function analyzedTotal(data: SearchResponse): number {
  return data.search_intelligence?.analyzed_total ?? data.total_results
}

export function contentBreakdown(data: SearchResponse) {
  return (
    data.search_intelligence?.content_breakdown ?? {
      primary: data.total_results,
      comments: 0,
      replies: 0,
      total: data.total_results,
    }
  )
}

export function sentimentPct(data: SearchResponse, key: "positive" | "negative" | "neutral"): number {
  return Math.round(data.sentiment_summary[key] ?? 0)
}

export function activeSourceCount(data: SearchResponse): number {
  const health = data.source_health
  if (health) {
    return Object.values(health).filter((s) => s.status === "ok" && s.count > 0).length
  }
  return data.platforms_searched?.length ?? 0
}

export type ScoreboardRow = {
  metric: string
  valueA: string
  valueB: string
  leader: "a" | "b" | "tie" | null
  leaderLabel: string | null
  hint?: string
}

export function buildScoreboard(
  dataA: SearchResponse,
  dataB: SearchResponse,
  nameA: string,
  nameB: string
): ScoreboardRow[] {
  const countA = analyzedTotal(dataA)
  const countB = analyzedTotal(dataB)
  const posA = sentimentPct(dataA, "positive")
  const posB = sentimentPct(dataB, "positive")
  const negA = sentimentPct(dataA, "negative")
  const negB = sentimentPct(dataB, "negative")
  const neuA = sentimentPct(dataA, "neutral")
  const neuB = sentimentPct(dataB, "neutral")

  const momA = dataA.search_intelligence?.period_comparison?.volume_change_pct
  const momB = dataB.search_intelligence?.period_comparison?.volume_change_pct

  const platA = activeSourceCount(dataA)
  const platB = activeSourceCount(dataB)

  const rows: ScoreboardRow[] = [
    {
      metric: "Conversation volume",
      valueA: String(countA),
      valueB: String(countB),
      leader: countA === countB ? "tie" : countA > countB ? "a" : "b",
      leaderLabel: countA === countB ? "Similar" : countA > countB ? `${nameA} leads` : `${nameB} leads`,
    },
    {
      metric: "Positive sentiment",
      valueA: `${posA}%`,
      valueB: `${posB}%`,
      leader: Math.abs(posA - posB) < 3 ? "tie" : posA > posB ? "a" : "b",
      leaderLabel:
        Math.abs(posA - posB) < 3
          ? "≈ Similar"
          : posA > posB
            ? `${nameA} higher`
            : `${nameB} higher`,
    },
    {
      metric: "Negative sentiment",
      valueA: `${negA}%`,
      valueB: `${negB}%`,
      leader: Math.abs(negA - negB) < 3 ? "tie" : negA < negB ? "a" : "b",
      leaderLabel:
        Math.abs(negA - negB) < 3
          ? "≈ Similar"
          : negA < negB
            ? `${nameA} lower`
            : `${nameB} lower`,
      hint: "Lower is healthier",
    },
    {
      metric: "Neutral sentiment",
      valueA: `${neuA}%`,
      valueB: `${neuB}%`,
      leader: Math.abs(neuA - neuB) < 4 ? "tie" : neuA > neuB ? "a" : "b",
      leaderLabel: Math.abs(neuA - neuB) < 4 ? "≈ Similar" : "Higher share",
    },
    {
      metric: "Active sources",
      valueA: String(platA),
      valueB: String(platB),
      leader: platA === platB ? "tie" : platA > platB ? "a" : "b",
      leaderLabel: platA === platB ? "Same coverage" : "More sources",
    },
  ]

  if (momA != null || momB != null) {
    const mA = momA ?? 0
    const mB = momB ?? 0
    rows.push({
      metric: "Volume momentum",
      valueA: momA != null ? `${mA > 0 ? "+" : ""}${Math.round(mA)}%` : "—",
      valueB: momB != null ? `${mB > 0 ? "+" : ""}${Math.round(mB)}%` : "—",
      leader:
        momA == null || momB == null
          ? null
          : Math.abs(mA - mB) < 5
            ? "tie"
            : mA > mB
              ? "a"
              : "b",
      leaderLabel:
        momA == null || momB == null
          ? "Partial data"
          : Math.abs(mA - mB) < 5
            ? "≈ Similar"
            : mA > mB
              ? `${nameA} gaining faster`
              : `${nameB} gaining faster`,
    })
  }

  const topA = topThemeLabel(dataA)
  const topB = topThemeLabel(dataB)
  if (topA || topB) {
    rows.push({
      metric: "Top theme",
      valueA: topA ?? "—",
      valueB: topB ?? "—",
      leader: null,
      leaderLabel: null,
    })
  }

  const srcA = dataA.most_active_platform
    ? platformDisplayName(dataA.most_active_platform)
    : "—"
  const srcB = dataB.most_active_platform
    ? platformDisplayName(dataB.most_active_platform)
    : "—"
  rows.push({
    metric: "Most active source",
    valueA: srcA,
    valueB: srcB,
    leader: null,
    leaderLabel: null,
  })

  return rows
}

function topThemeLabel(data: SearchResponse): string | null {
  const themes = getThemes(data)
  return themes[0]?.label ?? null
}

export function getThemes(data: SearchResponse, query?: string): ThemeItem[] {
  const intel = data.search_intelligence?.themes
  if (intel?.length) {
    return intel.filter((t) => (t.mentions ?? t.count ?? 0) >= 2)
  }
  const q = (query ?? data.query).toLowerCase()
  return (data.trending_keywords ?? [])
    .filter((k) => k.word.length > 2)
    .filter((k) => !STOPWORDS.has(k.word.toLowerCase()))
    .filter((k) => k.word.toLowerCase() !== q)
    .slice(0, 8)
    .map((k) => ({
      name: k.word,
      label: k.word.charAt(0).toUpperCase() + k.word.slice(1),
      count: k.count,
      mentions: k.count,
      sentiment: { positive: 33, neutral: 34, negative: 33 },
      dominant_sentiment: "neutral",
    }))
}

export type CategoryLeader = {
  category: string
  leader: "a" | "b" | "tie"
  label: string
}

export function buildCategoryLeaders(
  dataA: SearchResponse,
  dataB: SearchResponse,
  nameA: string,
  nameB: string
): CategoryLeader[] {
  const leaders: CategoryLeader[] = []
  const countA = analyzedTotal(dataA)
  const countB = analyzedTotal(dataB)
  if (countA !== countB) {
    leaders.push({
      category: "Conversation",
      leader: countA > countB ? "a" : "b",
      label: countA > countB ? nameA : nameB,
    })
  }

  const posA = sentimentPct(dataA, "positive")
  const posB = sentimentPct(dataB, "positive")
  if (Math.abs(posA - posB) >= 3) {
    leaders.push({
      category: "Positive sentiment",
      leader: posA > posB ? "a" : "b",
      label: posA > posB ? nameA : nameB,
    })
  }

  const negA = sentimentPct(dataA, "negative")
  const negB = sentimentPct(dataB, "negative")
  if (Math.abs(negA - negB) >= 3) {
    leaders.push({
      category: "Lower negativity",
      leader: negA < negB ? "a" : "b",
      label: negA < negB ? nameA : nameB,
    })
  }

  const momA = dataA.search_intelligence?.period_comparison?.volume_change_pct
  const momB = dataB.search_intelligence?.period_comparison?.volume_change_pct
  if (momA != null && momB != null && Math.abs(momA - momB) >= 5) {
    leaders.push({
      category: "Momentum",
      leader: momA > momB ? "a" : "b",
      label: momA > momB ? nameA : nameB,
    })
  }

  for (const p of dataA.search_intelligence?.platform_stats ?? []) {
    const match = dataB.search_intelligence?.platform_stats?.find(
      (x) => x.platform === p.platform
    )
    if (match && p.share_pct - match.share_pct >= 8) {
      leaders.push({
        category: `${platformDisplayName(p.platform)} visibility`,
        leader: "a",
        label: nameA,
      })
    }
  }
  for (const p of dataB.search_intelligence?.platform_stats ?? []) {
    const match = dataA.search_intelligence?.platform_stats?.find(
      (x) => x.platform === p.platform
    )
    if (match && p.share_pct - match.share_pct >= 8) {
      leaders.push({
        category: `${platformDisplayName(p.platform)} visibility`,
        leader: "b",
        label: nameB,
      })
    }
  }

  return leaders
}

export type OverallEdge = {
  scoreA: number
  scoreB: number
  labelA: string
  labelB: string
  explanation: string
}

/** Transparent weighted edge — not a "winner", just comparative balance. */
export function computeOverallEdge(
  dataA: SearchResponse,
  dataB: SearchResponse,
  nameA: string,
  nameB: string
): OverallEdge | null {
  const countA = analyzedTotal(dataA)
  const countB = analyzedTotal(dataB)
  if (countA < 5 || countB < 5) return null

  const maxCount = Math.max(countA, countB, 1)
  const volA = (countA / maxCount) * 30
  const volB = (countB / maxCount) * 30

  const posA = (sentimentPct(dataA, "positive") / 100) * 25
  const posB = (sentimentPct(dataB, "positive") / 100) * 25

  const negA = ((100 - sentimentPct(dataA, "negative")) / 100) * 20
  const negB = ((100 - sentimentPct(dataB, "negative")) / 100) * 20

  const momA = dataA.search_intelligence?.period_comparison?.volume_change_pct ?? 0
  const momB = dataB.search_intelligence?.period_comparison?.volume_change_pct ?? 0
  const maxMom = Math.max(Math.abs(momA), Math.abs(momB), 1)
  const momScoreA = 15 * (0.5 + momA / maxMom / 2)
  const momScoreB = 15 * (0.5 + momB / maxMom / 2)

  const divA = (activeSourceCount(dataA) / 10) * 10
  const divB = (activeSourceCount(dataB) / 10) * 10

  const scoreA = Math.round(volA + posA + negA + momScoreA + divA)
  const scoreB = Math.round(volB + posB + negB + momScoreB + divB)

  return {
    scoreA,
    scoreB,
    labelA: nameA,
    labelB: nameB,
    explanation:
      "Weighted: volume 30%, positive 25%, lower negativity 20%, momentum 15%, source diversity 10%.",
  }
}

export function sentimentDifference(
  dataA: SearchResponse,
  dataB: SearchResponse
): { key: string; diffPp: number; label: string }[] {
  return (["positive", "neutral", "negative"] as const).map((key) => {
    const a = sentimentPct(dataA, key)
    const b = sentimentPct(dataB, key)
    const diff = b - a
    const name = key.charAt(0).toUpperCase() + key.slice(1)
    return {
      key,
      diffPp: diff,
      label:
        Math.abs(diff) < 3
          ? `${name} ≈ similar`
          : `${diff > 0 ? "+" : ""}${diff} pp (${key === "negative" ? "lower is better" : ""})`.trim(),
    }
  })
}

export function buildSentimentVerdict(
  dataA: SearchResponse,
  dataB: SearchResponse,
  nameA: string,
  nameB: string
): string {
  const negA = sentimentPct(dataA, "negative")
  const negB = sentimentPct(dataB, "negative")
  const posA = sentimentPct(dataA, "positive")
  const posB = sentimentPct(dataB, "positive")

  if (Math.abs(negA - negB) >= 3 && Math.abs(posA - posB) < 3) {
    const cleaner = negA < negB ? nameA : nameB
    const diff = Math.abs(negA - negB)
    return `${cleaner} has a cleaner sentiment profile. Negative sentiment is ${diff} percentage points lower, while positive sentiment is roughly equal.`
  }
  if (Math.abs(posA - posB) >= 3) {
    const leader = posA > posB ? nameA : nameB
    return `${leader} shows higher positive sentiment (${Math.max(posA, posB)}% vs ${Math.min(posA, posB)}%).`
  }
  return "Sentiment profiles are closely matched across both topics."
}

export function sharedThemes(
  dataA: SearchResponse,
  dataB: SearchResponse,
  nameA: string,
  nameB: string
): string[] {
  const a = new Set(getThemes(dataA, nameA).map((t) => t.label.toLowerCase()))
  const b = getThemes(dataB, nameB).map((t) => t.label.toLowerCase())
  return b.filter((t) => a.has(t)).slice(0, 8)
}

export function differentiatingThemes(
  data: SearchResponse,
  other: SearchResponse,
  query: string,
  otherQuery: string
): ThemeItem[] {
  const otherLabels = new Set(
    getThemes(other, otherQuery).map((t) => t.label.toLowerCase())
  )
  return getThemes(data, query)
    .filter((t) => !otherLabels.has(t.label.toLowerCase()))
    .slice(0, 5)
}

export function comparisonConfidence(
  dataA: SearchResponse,
  dataB: SearchResponse
): { level: string; explanation: string; warning?: string } {
  const countA = analyzedTotal(dataA)
  const countB = analyzedTotal(dataB)
  const min = Math.min(countA, countB)
  const max = Math.max(countA, countB)

  if (min < 10) {
    return {
      level: "Low",
      explanation: `Limited samples (${countA} vs ${countB} analyzed items). Interpret percentages cautiously.`,
      warning: min < 6 ? "Insufficient data for strong comparison conclusions." : undefined,
    }
  }

  if (max > min * 2.5) {
    return {
      level: "Moderate",
      explanation: `${Math.round(max / min)}× coverage difference between topics. Sentiment comparisons may reflect sample size, not just opinion.`,
      warning: "Coverage warning — one topic has substantially more analyzed content.",
    }
  }

  return {
    level: countA >= 50 && countB >= 50 ? "High" : "Moderate",
    explanation: `Both topics have similar sample sizes (${countA} vs ${countB} analyzed items).`,
  }
}

export function buildExecutiveSummary(
  dataA: SearchResponse,
  dataB: SearchResponse,
  _nameA: string,
  _nameB: string
): { headline: string; bullets: string[] } {
  const conclusion = buildCompareConclusion(dataA, dataB)
  return {
    headline: conclusion.headline,
    bullets: conclusion.paragraphs,
  }
}

export function buildPulseAiCompareUrl(
  nameA: string,
  nameB: string,
  dataA: SearchResponse,
  dataB: SearchResponse
): string {
  const prompt = `Compare ${nameA} vs ${nameB}. ${nameA} has ${analyzedTotal(dataA)} mentions (${sentimentPct(dataA, "positive")}% positive, ${sentimentPct(dataA, "negative")}% negative). ${nameB} has ${analyzedTotal(dataB)} mentions (${sentimentPct(dataB, "positive")}% positive, ${sentimentPct(dataB, "negative")}% negative). What are the biggest differences?`
  return `/chat?prompt=${encodeURIComponent(prompt)}`
}

export function formatRelativeUpdated(iso: string | undefined): string {
  if (!iso) return "Recently"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  return new Date(iso).toLocaleString()
}

export function peakActivity(data: SearchResponse): { label: string; count?: number } {
  return {
    label: data.peak_discussion ?? "Not available",
    count: data.search_intelligence?.period_comparison?.current_volume,
  }
}

export type TopicFactualContext = {
  text: string | null
  wikiTitle: string | null
  wikiUrl: string | null
}

/** Factual background only — excludes OpinionPulse analytics paragraphs. */
export function extractFactualContext(data: SearchResponse): TopicFactualContext {
  const wiki = data.wiki_summary
  const wikiUrl =
    wiki?.url && wiki.url.startsWith("https://") ? wiki.url : null
  const wikiText = (wiki?.summary ?? wiki?.extract ?? "").trim()

  if (wikiText) {
    return {
      text: wikiText,
      wikiTitle: wiki?.title?.trim() || data.query,
      wikiUrl,
    }
  }

  const overview = data.topic_summary?.overview?.trim()
  if (overview) {
    const firstParagraph = overview.split("\n\n").map((p) => p.trim()).find(Boolean)
    if (
      firstParagraph &&
      !firstParagraph.startsWith("OpinionPulse analyzed") &&
      !firstParagraph.startsWith("No live mentions were found")
    ) {
      return {
        text: firstParagraph,
        wikiTitle: null,
        wikiUrl: null,
      }
    }
  }

  return { text: null, wikiTitle: null, wikiUrl: null }
}

export function platformStatsForCompare(data: SearchResponse) {
  const stats = data.search_intelligence?.platform_stats
  if (stats?.length) return stats
  const counts: Record<string, number> = {}
  data.results.forEach((r) => {
    counts[r.platform] = (counts[r.platform] || 0) + 1
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts)
    .map(([platform, content_count]) => ({
      platform,
      content_count,
      share_pct: Math.round((content_count / total) * 100),
      primary: content_count,
      comments: 0,
      replies: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      engagement_level: "medium",
    }))
    .sort((a, b) => b.content_count - a.content_count)
}
