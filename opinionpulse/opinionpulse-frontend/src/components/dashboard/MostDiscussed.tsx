import { Loader2, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { MostDiscussedItem } from "@/api/dashboard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatUpdatedLabel } from "@/lib/formatTimeAgo"
import { platformDotColor } from "@/lib/platformDots"
import { cn } from "@/lib/utils"

type MostDiscussedProps = {
  items?: MostDiscussedItem[]
  isLoading?: boolean
  isRefreshing?: boolean
  lastUpdated?: string | null
  onRefresh?: () => void
}

function TrendLabel({ trend }: { trend: MostDiscussedItem["trend"] }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium text-[var(--dash-pos)]">
        <TrendingUp className="size-3.5" strokeWidth={2} /> Up
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium text-[var(--dash-neg)]">
        <TrendingDown className="size-3.5" strokeWidth={2} /> Down
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 font-medium text-[var(--dash-text-faint)]">
      <Minus className="size-3.5" strokeWidth={2} /> Stable
    </span>
  )
}

function MostDiscussedSkeleton() {
  return (
    <div className={cn(dashCardStatic, "overflow-hidden")}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border-b border-[var(--dash-border)] px-5 py-4 last:border-b-0"
        >
          <div
            className="dash-skeleton h-4 rounded bg-[var(--dash-surface-alt)]"
            style={{ width: `${70 - i * 5}%` }}
          />
        </div>
      ))}
    </div>
  )
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
        <Loader2 className="size-4 animate-spin text-[var(--dash-text-faint)]" />
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg p-1.5 text-[var(--dash-text-faint)] transition-colors duration-150 hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
          aria-label="Refresh most discussed"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </button>
      )}
    </div>
  )

  return (
    <DashboardSection
      title="Most discussed this week"
      description="Ranked by total engagement across all platforms"
      action={headerAction}
    >
      {isLoading ? (
        <MostDiscussedSkeleton />
      ) : items.length === 0 ? (
        <div className={cn(dashCardStatic, "overflow-hidden")}>
          <DashboardEmptyState
            title="Nothing trending yet"
            description="Check back soon, or run a search to get started"
          />
        </div>
      ) : (
        <div className={cn(dashCardStatic, "overflow-hidden")}>
          {items.map((item, index) => {
            const rank = index + 1
            const pos = item.sentiment.positive
            const query = item.query || item.topic
            const platforms = Object.keys(item.platform_breakdown || {})
            const barColor =
              pos >= 30 ? "var(--dash-pos)" : "var(--dash-neg)"

            return (
              <button
                key={item.topic}
                type="button"
                onClick={() =>
                  navigate(`/search?q=${encodeURIComponent(query)}`)
                }
                className={cn(
                  "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-[var(--dash-surface-alt)]",
                  index < items.length - 1 && "border-b border-[var(--dash-border)]"
                )}
              >
                <div
                  className={cn(
                    "w-8 shrink-0 text-[15px] font-semibold tabular-nums",
                    rank === 1
                      ? "text-[var(--dash-accent)]"
                      : "text-[var(--dash-text-faint)]"
                  )}
                >
                  #{rank}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-[var(--dash-text)]">
                      {item.topic}
                    </span>
                    <span
                      className="shrink-0 text-[13px] font-semibold"
                      style={{ color: barColor }}
                    >
                      {pos}% pos
                    </span>
                  </div>

                  <div className="mb-1.5 h-[5px] overflow-hidden rounded-sm bg-[var(--dash-surface-alt)]">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${pos}%`, background: barColor }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-text-faint)]">
                    <span>{item.total_mentions.toLocaleString()} mentions</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex gap-[3px]">
                      {platforms.slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="size-1.5 rounded-full"
                          style={{ background: platformDotColor(p) }}
                          title={p}
                        />
                      ))}
                    </span>
                    <span aria-hidden>·</span>
                    <TrendLabel trend={item.trend} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {lastUpdated && (
        <p className="mt-3 text-xs text-[var(--dash-text-faint)]">
          {formatUpdatedLabel(lastUpdated)}
        </p>
      )}
    </DashboardSection>
  )
}
