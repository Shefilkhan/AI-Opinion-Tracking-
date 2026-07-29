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
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  github: "GitHub",
  stackoverflow: "Stack Overflow",
  wikipedia: "Wikipedia",
}

const STATUS_VARIANT: Record<string, "live" | "off" | "neutral" | "warning"> = {
  ok: "live",
  empty: "neutral",
  missing_key: "off",
  timeout: "warning",
  rate_limited: "warning",
  error: "warning",
}

type SourcesStatusBarProps = {
  data: SearchResponse
}

export function SourcesStatusBar({ data }: SourcesStatusBarProps) {
  const configured = data.apis_configured ?? data.platforms_live ?? {}
  const health = data.source_health ?? {}
  const searched = new Set(data.platforms_searched ?? [])
  const resultPlatforms = new Set(
    (data.results ?? []).map((r) => r.platform?.toLowerCase()).filter(Boolean)
  )
  const freshness = data.data_freshness?.fetched_at

  const entries = Object.keys(SOURCE_LABELS).filter(
    (k) => k !== "wikipedia" && (configured[k] !== false || k === "reddit")
  )

  return (
    <div className={cn(proCard, "flex flex-col gap-2 px-4 py-3")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Sources
        </span>
        {entries.map((key) => {
          const hasKey = configured[key] !== false
          const h = health[key]
          const gotResults =
            resultPlatforms.has(key) || searched.has(key) || (h?.count ?? 0) > 0
          const label = SOURCE_LABELS[key]
          const variant =
            STATUS_VARIANT[h?.status ?? ""] ??
            (gotResults ? "live" : !hasKey ? "off" : "neutral")

          return (
            <StatusPill
              key={key}
              label={
                h?.count
                  ? `${label} (${h.count})`
                  : label
              }
              variant={variant}
              live={variant === "live"}
            />
          )
        })}
      </div>
      {freshness && (
        <p className="text-xs text-muted-foreground">
          Updated {new Date(freshness).toLocaleTimeString()}
          {data.relevance_mode === "strict" ? " · Strict relevance" : ""}
        </p>
      )}
    </div>
  )
}
