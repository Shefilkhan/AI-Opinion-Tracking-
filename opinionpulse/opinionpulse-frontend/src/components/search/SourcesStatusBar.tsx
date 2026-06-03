import type { SearchResponse } from "@/lib/api/types"

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  newsapi: "NewsAPI",
  youtube: "YouTube",
  guardian: "Guardian",
  mediastack: "Mediastack",
  currents: "Currents",
  gnews: "GNews",
  devto: "Dev.to",
  hackernews: "HN",
  wikipedia: "Wikipedia",
}

type SourcesStatusBarProps = {
  data: SearchResponse
}

export function SourcesStatusBar({ data }: SourcesStatusBarProps) {
  const configured = data.apis_configured ?? data.platforms_live ?? {}
  const searched = new Set(data.platforms_searched ?? [])

  const entries = Object.keys(SOURCE_LABELS).filter(
    (k) => k !== "wikipedia" && (configured[k] !== false || k === "reddit")
  )

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
      <span className="font-medium text-gray-500">Sources:</span>
      {entries.map((key) => {
        const hasKey = configured[key] !== false
        const gotResults = searched.has(key)
        const label = SOURCE_LABELS[key]
        let status: string
        let className: string
        if (gotResults) {
          status = "✓"
          className = "text-green-600"
        } else if (!hasKey) {
          status = "✗ key missing"
          className = "text-gray-400"
        } else {
          status = "○ no hits"
          className = "text-amber-600"
        }
        return (
          <span key={key} className={className}>
            {label} {status}
          </span>
        )
      })}
    </div>
  )
}
