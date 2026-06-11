import { Loader2, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { MostDiscussedItem } from "@/api/dashboard"
import { PageSection } from "@/components/layout/PageSection"
import { platformBadge } from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

type MostDiscussedProps = {
  items?: MostDiscussedItem[]
  isLoading?: boolean
  isRefreshing?: boolean
  lastUpdated?: string | null
  onRefresh?: () => void
}

function formatUpdatedAgo(iso?: string | null): string {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return "Updated just now"
  if (mins === 1) return "Updated 1 minute ago"
  return `Updated ${mins} minutes ago`
}

function sentimentPctColor(pct: number): string {
  if (pct > 60) return "text-success"
  if (pct < 40) return "text-destructive"
  return "text-muted-foreground"
}

function TrendIcon({ trend }: { trend: MostDiscussedItem["trend"] }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-success">
        <TrendingUp className="size-3.5" /> Up
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-destructive">
        <TrendingDown className="size-3.5" /> Down
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="size-3.5" /> Stable
    </span>
  )
}

function MostDiscussedSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="py-4">
          <div
            className="h-5 animate-pulse rounded bg-muted"
            style={{ width: `${70 - i * 5}%` }}
          />
        </li>
      ))}
    </ul>
  )
}

function rankBorder(rank: number): string {
  if (rank === 1) return "border-l-4 border-primary/40 pl-3"
  if (rank === 2) return "border-l-4 border-muted-foreground/30 pl-3"
  if (rank === 3) return "border-l-4 border-primary/20 pl-3"
  return "pl-3"
}

export function MostDiscussed({
  items = [],
  isLoading,
  isRefreshing,
  lastUpdated,
  onRefresh,
}: MostDiscussedProps) {
  const navigate = useNavigate()

  const headerAction = (
    <div className="flex items-center gap-2">
      {isRefreshing && (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Refresh most discussed"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </button>
      )}
    </div>
  )

  return (
    <PageSection
      title="Most Discussed This Week"
      description="Ranked by total engagement across all platforms"
      action={headerAction}
    >
      {isLoading ? (
        <MostDiscussedSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading trending topics…
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item, index) => {
            const rank = index + 1
            const pos = item.sentiment.positive
            const query = item.query || item.topic
            const platforms = Object.keys(item.platform_breakdown || {})

            return (
              <li key={item.topic}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/search?q=${encodeURIComponent(query)}`)
                  }
                  className={cn(
                    "flex w-full flex-wrap items-center gap-3 rounded-[var(--radius-xl)] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:bg-card/60 backdrop-blur-sm border border-transparent hover:border-primary/20",
                    rankBorder(rank)
                  )}
                >
                  <span className="w-8 shrink-0 text-[28px] font-medium leading-none text-muted-foreground/30">
                    #{rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-foreground">
                      {item.topic}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div
                        className="h-1.5 w-[100px] overflow-hidden rounded-full bg-muted"
                        title={`${pos}% positive`}
                      >
                        <div
                          className="h-full bg-success"
                          style={{ width: `${pos}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          sentimentPctColor(pos)
                        )}
                      >
                        {pos}% pos
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                      {item.total_mentions.toLocaleString()} mentions •{" "}
                      <span className="inline-flex items-center gap-1">
                        {platforms.slice(0, 4).map((p) => {
                          const plat = platformBadge(p)
                          return (
                            <span
                              key={p}
                              className={cn(
                                "inline-block size-2 rounded-full",
                                plat.className.split(" ")[0]
                              )}
                              title={plat.label}
                            />
                          )
                        })}
                      </span>{" "}
                      • <TrendIcon trend={item.trend} />
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {lastUpdated && (
        <p className="mt-3 text-xs text-muted-foreground">
          {formatUpdatedAgo(lastUpdated)}
        </p>
      )}
    </PageSection>
  )
}
