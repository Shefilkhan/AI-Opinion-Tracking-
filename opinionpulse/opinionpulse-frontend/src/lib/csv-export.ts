import type { SearchHistoryRow } from "@/lib/api/search"
import type { SearchResponse, SearchResultItem } from "@/lib/api/types"
import { platformDisplayName } from "@/lib/api/sentiment"

/** Escape a CSV cell for Excel (RFC 4180). */
export function csvCell(value: unknown): string {
  if (value == null || value === "") return ""
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function formatExportDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "export"
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.visibility = "hidden"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const RESULT_HEADERS = [
  "Row",
  "Platform",
  "Content Type",
  "Author",
  "Sentiment",
  "Sentiment Score",
  "Posted At",
  "Title",
  "Content",
  "Likes",
  "Comments",
  "Views",
  "Shares",
  "Publication",
  "Source URL",
] as const

function resultToRow(index: number, r: SearchResultItem): string[] {
  const url = r.source_url || r.url || ""
  return [
    csvCell(index),
    csvCell(platformDisplayName(r.platform)),
    csvCell(r.content_type || ""),
    csvCell(r.author),
    csvCell(r.sentiment),
    csvCell(r.sentiment_score?.toFixed(2) ?? ""),
    csvCell(formatExportDate(r.posted_at)),
    csvCell(r.title || ""),
    csvCell(r.content || ""),
    csvCell(r.engagement?.likes ?? 0),
    csvCell(r.engagement?.comments ?? 0),
    csvCell(r.engagement?.views ?? ""),
    csvCell(r.engagement?.shares ?? ""),
    csvCell(r.publication || r.source_label || ""),
    csvCell(url),
  ]
}

type DetailedExportOptions = {
  history?: SearchHistoryRow | null
  maxRows?: number | null
}

/** Full report: summary block + one row per search result. */
export function buildDetailedSearchCsv(
  data: SearchResponse,
  options: DetailedExportOptions = {}
): string {
  const { history, maxRows } = options
  const sentiment = data.sentiment_summary
  const pos = Math.round(sentiment.positive)
  const neu = Math.round(sentiment.neutral)
  const neg = Math.round(sentiment.negative)
  const platforms = (data.platforms_searched || [])
    .map((p) => platformDisplayName(p))
    .join(", ")
  const wiki = data.wiki_summary?.summary?.trim()
  const topicOverview = data.topic_summary?.overview?.split("\n\n")[0]?.trim()

  const summaryLines: string[] = [
    "OpinionPulse Search Report",
    "",
    "Field,Value",
    `Query,${csvCell(data.query)}`,
    `Report Generated,${csvCell(formatExportDate(new Date()))}`,
  ]

  if (history) {
    summaryLines.push(`Original Search Date,${csvCell(formatExportDate(history.searched_at))}`)
  }

  summaryLines.push(
    `Total Results,${csvCell(data.total_results)}`,
    `Analyzed Items,${csvCell(data.search_intelligence?.analyzed_total ?? data.total_results)}`,
    `Positive Sentiment,${csvCell(`${pos}%`)}`,
    `Neutral Sentiment,${csvCell(`${neu}%`)}`,
    `Negative Sentiment,${csvCell(`${neg}%`)}`,
    `Platforms Searched,${csvCell(platforms || "—")}`,
    `Most Active Platform,${csvCell(data.most_active_platform ? platformDisplayName(data.most_active_platform) : "—")}`,
    `Peak Discussion,${csvCell(data.peak_discussion || "—")}`,
  )

  if (wiki) {
    summaryLines.push(`Wikipedia Context,${csvCell(wiki.slice(0, 500))}`)
  } else if (topicOverview) {
    summaryLines.push(`Topic Overview,${csvCell(topicOverview.slice(0, 500))}`)
  }

  let exportRows = data.results ?? []
  if (maxRows != null && maxRows > 0 && maxRows !== -1) {
    exportRows = exportRows.slice(0, maxRows)
  }

  summaryLines.push(
    "",
    "Detailed Results",
    RESULT_HEADERS.join(","),
    ...exportRows.map((r, i) => resultToRow(i + 1, r).join(",")),
  )

  return summaryLines.join("\r\n")
}

export function buildSearchHistorySummaryCsv(rows: SearchHistoryRow[]): string {
  const header = [
    "Query",
    "Search Date",
    "Results Count",
    "Positive %",
    "Neutral %",
    "Negative %",
    "Dominant Tone",
  ].join(",")

  const body = rows.map((r) => {
    const pos = r.sentiment_positive ?? ""
    const neu = r.sentiment_neutral ?? ""
    const neg = r.sentiment_negative ?? ""
    let tone = "Mixed"
    if (typeof pos === "number" && typeof neg === "number" && typeof neu === "number") {
      if (pos >= neg && pos >= neu) tone = "Positive"
      else if (neg >= pos && neg >= neu) tone = "Negative"
      else tone = "Neutral"
    }
    return [
      csvCell(r.query),
      csvCell(formatExportDate(r.searched_at)),
      csvCell(r.results_count),
      csvCell(pos),
      csvCell(neu),
      csvCell(neg),
      csvCell(tone),
    ].join(",")
  })

  return ["OpinionPulse Search History Summary", "", header, ...body].join("\r\n")
}

export function detailedSearchFilename(query: string): string {
  const date = new Date().toISOString().split("T")[0]
  return `opinionpulse_${slugify(query)}_${date}.csv`
}

export function historySummaryFilename(): string {
  return `opinionpulse_search_history_${new Date().toISOString().split("T")[0]}.csv`
}
