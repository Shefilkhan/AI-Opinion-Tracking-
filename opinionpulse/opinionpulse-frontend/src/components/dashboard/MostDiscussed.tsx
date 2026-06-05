import { Loader2, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { MostDiscussedItem } from "@/api/dashboard"
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
  if (pct > 60) return "text-green-600"
  if (pct < 40) return "text-red-600"
  return "text-gray-600"
}

function TrendIcon({ trend }: { trend: MostDiscussedItem["trend"] }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
        <TrendingUp className="size-3.5" /> Up
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-red-600">
        <TrendingDown className="size-3.5" /> Down
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
      <Minus className="size-3.5" /> Stable
    </span>
  )
}

function MostDiscussedSkeleton() {
  return (
    <ul className="divide-y divide-gray-200">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="py-4">
          <div
            className="h-5 animate-pulse rounded bg-gray-100"
            style={{ width: `${70 - i * 5}%` }}
          />
        </li>
      ))}
    </ul>
  )
}

function rankBorder(rank: number): string {
  if (rank === 1) return "border-l-4 border-yellow-400 pl-3"
  if (rank === 2) return "border-l-4 border-gray-400 pl-3"
  if (rank === 3) return "border-l-4 border-orange-400 pl-3"
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

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          📈 Most Discussed This Week
        </h2>
        {isRefreshing && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            aria-label="Refresh most discussed"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Ranked by total engagement across all platforms
      </p>

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
        <ul className="divide-y divide-gray-200">
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
                    "flex w-full flex-wrap items-center gap-3 py-4 text-left transition-colors hover:bg-gray-50/80",
                    rankBorder(rank)
                  )}
                >
                  <span className="w-8 shrink-0 text-[28px] font-bold leading-none text-gray-300">
                    #{rank}
                  </span>
                  <span className="text-xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-foreground">
                      {item.topic}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div
                        className="h-1.5 w-[100px] overflow-hidden rounded-full bg-gray-100"
                        title={`${pos}% positive`}
                      >
                        <div
                          className="h-full bg-green-500"
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
                    <p className="mt-1.5 text-[13px] text-gray-500">
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
    </section>
  )
}
