import { Link } from "react-router-dom"
import type { LiveDebateItem } from "@/api/dashboard"
import { platformBadge } from "@/lib/api/sentiment"
import { dashCardStatic } from "@/lib/dash-classes"
import { platformBrandColor } from "@/lib/platformBrandColors"
import { cn } from "@/lib/utils"

type RecentActivityPanelProps = {
  items: LiveDebateItem[]
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
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
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--dash-text-faint)]">No recent debates yet.</p>
        ) : (
          rows.map((item) => {
            const platform = item.platforms[0] ?? "reddit"
            const badge = platformBadge(platform)
            const brand = platformBrandColor(platform)
            const netPositive = item.sentiment.positive - item.sentiment.negative
            const isPositive = netPositive >= 0

            return (
              <Link
                key={`${item.topic}-${item.headline}`}
                to={`/search?q=${encodeURIComponent(item.topic)}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--dash-surface-alt)]"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: brand }}
                >
                  {badge.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--dash-text)]">
                    {item.headline}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--dash-text-faint)]">
                    {item.time_ago || "Recently"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    isPositive ? "text-[var(--dash-pos)]" : "text-[var(--dash-neg)]"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {netPositive}%
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
