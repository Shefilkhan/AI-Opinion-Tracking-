import type { SearchResponse } from "@/lib/api/types"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  newsapi: "NewsAPI",
  youtube: "YouTube",
  guardian: "Guardian",
  mediastack: "Mediastack",
  currents: "Currents",
  gnews: "GNews",
  devto: "Dev.to",
  hackernews: "Hacker News",
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
    <div className={cn(proCard, "flex flex-wrap items-center gap-2 px-4 py-3")}>
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Sources
      </span>
      {entries.map((key) => {
        const hasKey = configured[key] !== false
        const gotResults = searched.has(key)
        const label = SOURCE_LABELS[key]

        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              gotResults
                ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                : !hasKey
                  ? "bg-gray-100 text-gray-500 dark:bg-[#252538] dark:text-gray-500"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            )}
          >
            {gotResults ? "✓" : !hasKey ? "✗" : "○"} {label}
          </span>
        )
      })}
    </div>
  )
}
