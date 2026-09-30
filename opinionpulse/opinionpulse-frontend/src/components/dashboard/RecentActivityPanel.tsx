import { Link } from "react-router-dom"
import type { SearchHistoryRow } from "@/lib/api/search"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatRelativeTime } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type RecentActivityPanelProps = {
  items: SearchHistoryRow[]
  isLoading?: boolean
}

function sentimentNet(item: SearchHistoryRow): number | null {
  const pos = item.sentiment_positive
  const neg = item.sentiment_negative
  if (pos == null || neg == null) return null
  return pos - neg
}

export function RecentActivityPanel({ items, isLoading }: RecentActivityPanelProps) {
  const rows = items.slice(0, 5)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif-display text-lg font-semibold text-[var(--dash-text)]">Recent activity</h2>
        <Link
          to="/search"
          className="text-sm font-medium text-[var(--dash-accent)] transition-opacity hover:opacity-80"
        >
          See All
        </Link>
      </div>

      <div className={cn(dashCardStatic, "flex-1 divide-y divide-[var(--dash-border)] p-0")}>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[var(--dash-surface-alt)]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--dash-text-faint)]">
            No searches yet. Try searching for a topic above.
          </p>
        ) : (
          rows.map((item) => {
            const net = sentimentNet(item)
            const isPositive = net == null || net >= 0

            return (
              <Link
                key={item.id}
                to={`/search?q=${encodeURIComponent(item.query)}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--dash-surface-alt)]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--dash-surface-alt)] text-sm font-semibold text-[var(--dash-text-mid)]">
                  {item.query.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize text-[var(--dash-text)]">
                    {item.query}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--dash-text-faint)]">
                    {item.results_count.toLocaleString()} results · {formatRelativeTime(item.searched_at)}
                  </p>
                </div>
                {net != null && (
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      isPositive ? "text-[var(--dash-pos)]" : "text-[var(--dash-neg)]"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {net}%
                  </span>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
