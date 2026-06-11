import type { SearchResponse } from "@/lib/api/types"
import { StatusPill } from "@/components/layout/StatusPill"
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
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        Sources
      </span>
      {entries.map((key) => {
        const hasKey = configured[key] !== false
        const gotResults = searched.has(key)
        const label = SOURCE_LABELS[key]

        return (
          <StatusPill
            key={key}
            label={label}
            variant={
              gotResults ? "live" : !hasKey ? "off" : "neutral"
            }
            live={gotResults}
          />
        )
      })}
    </div>
  )
}
