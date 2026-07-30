import type { ChatMessageItem, DiscussionTheme, SentimentSnapshot, ThemeTableRow } from "@/components/chat/types"

export function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function stripMarkdownTables(content: string): string {
  return content
    .replace(/\|[^\n]+\|\n\|[-| :]+\|\n(\|[^\n]+\|\n?)+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function extractTopic(content: string, query?: string | null): string {
  if (query) return query
  const snapshot = content.match(/([^—\n]+)\s*—\s*Opinion Snapshot/i)
  if (snapshot) return snapshot[1].trim()
  const firstLine = content.split("\n")[0]?.replace(/\*\*/g, "").trim()
  if (firstLine && firstLine.length < 80) return firstLine
  return "Topic"
}

export function parseSentimentSnapshot(message: ChatMessageItem): SentimentSnapshot | null {
  const contentLower = message.content.toLowerCase()
  let trend: "rising" | "falling" | undefined
  if (contentLower.includes("rising") || contentLower.includes("↑")) trend = "rising"
  else if (contentLower.includes("falling") || contentLower.includes("↓")) trend = "falling"

  const sentiment = message.dataUsed?.sentiment
  if (sentiment && typeof sentiment === "object") {
    const positive = Number(sentiment.positive ?? sentiment.Positive ?? 0)
    const negative = Number(sentiment.negative ?? sentiment.Negative ?? 0)
    const neutral = Number(sentiment.neutral ?? sentiment.Neutral ?? 0)

    if (positive + negative + neutral > 0) {
      return {
        topic: extractTopic(message.content, message.dataUsed?.query),
        positive,
        neutral,
        negative,
        dominantPlatform: message.dataUsed?.platforms?.[0] ?? parseDominantPlatform(message.content),
        trend,
      }
    }
  }

  const match = message.content.match(
    /Positive\s+(\d+)%[^]*?Neutral\s+(\d+)%[^]*?Negative\s+(\d+)%/i
  )
  if (match) {
    return {
      topic: extractTopic(message.content, message.dataUsed?.query),
      positive: Number(match[1]),
      neutral: Number(match[2]),
      negative: Number(match[3]),
      dominantPlatform: message.dataUsed?.platforms?.[0] ?? parseDominantPlatform(message.content),
      trend,
    }
  }

  return null
}

export function parseDiscussionThemes(message: ChatMessageItem): DiscussionTheme[] | null {
  const items = message.structured?.items
  if (!items?.length) return null
  return items.map((item) => ({
    label: item.label,
    percentage: item.pct,
    detail: item.detail,
  }))
}

export function parseThemesTable(message: ChatMessageItem): ThemeTableRow[] | null {
  const items = message.structured?.items
  if (!items?.length) return null
  return items.map((item) => ({
    theme: item.label,
    share: item.pct,
    detail: item.detail ?? "—",
  }))
}

export function getDisplayTextContent(message: ChatMessageItem): string {
  let text = message.content
  if (message.structured?.items?.length) {
    text = stripMarkdownTables(text)
  }
  return text.trim()
}

export function isResearchBrief(message: ChatMessageItem): boolean {
  return message.structured?.type === "research_brief"
}

export function isDatabaseError(content: string): boolean {
  const lower = content.toLowerCase()
  return (
    lower.includes("pymysql") ||
    lower.includes("operationalerror") ||
    lower.includes("sqlalchemy") ||
    lower.includes("[sql:") ||
    lower.includes("unknown column")
  )
}

export function getUserInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U"
}

function parseDominantPlatform(content: string): string | undefined {
  const match = content.match(/Dominant Platform:\s*(\w+)/i)
  return match?.[1]
}
