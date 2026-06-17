import { Link } from "react-router-dom"
import type { DashboardOverview } from "@/api/dashboard"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type OverviewPulseCardsProps = {
  stats: DashboardOverview["stats"]
  sourcesLive: number
}

export function OverviewPulseCards({ stats, sourcesLive }: OverviewPulseCardsProps) {
  const positiveVal = stats.positive_sentiment.value
  const searchesVal = stats.searches_today.value

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif-display text-lg font-semibold text-[var(--dash-text)]">My Pulse</h2>
        <Link
          to="/search"
          className="text-sm font-medium text-[var(--dash-accent)] transition-opacity hover:opacity-80"
        >
          See All
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "relative min-h-[170px] min-w-[260px] flex-1 overflow-hidden rounded-[var(--dash-radius)] p-5 text-white shadow-[var(--dash-shadow)]",
            "sm:min-w-[280px]"
          )}
          style={{ background: "var(--dash-card-gradient)" }}
        >
          <p className="text-sm font-normal text-white/80">Sentiment balance</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{positiveVal}</p>
          <p className="mt-1 text-xs text-white/70">{stats.positive_sentiment.subtitle}</p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/60">Trending</p>
              <p className="text-sm font-medium">{stats.topics_trending.value}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-white/60">Sources</p>
              <p className="text-sm font-medium">{sourcesLive} live</p>
            </div>
            <div className="flex gap-0.5 opacity-90" aria-hidden>
              <span className="size-6 rounded bg-white/20" />
              <span className="size-6 rounded bg-white/30" />
            </div>
          </div>
        </div>

        <div
          className={cn(
            dashCardStatic,
            "relative min-h-[170px] min-w-[260px] flex-1 overflow-hidden p-5 sm:min-w-[280px]"
          )}
        >
          <p className="text-sm text-[var(--dash-text-mid)]">Searches today</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--dash-text)]">
            {searchesVal}
          </p>
          <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
            {stats.searches_today.subtitle}
          </p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--dash-text-faint)]">
                Negative
              </p>
              <p className="text-sm font-semibold text-[var(--dash-neg)]">
                {stats.negative_sentiment.value}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-[var(--dash-text-faint)]">
                Card holder
              </p>
              <p className="text-sm font-medium text-[var(--dash-text)]">OpinionPulse</p>
            </div>
            <div className="flex gap-0.5" aria-hidden>
              <span className="size-6 rounded bg-[var(--dash-surface-alt)]" />
              <span className="size-6 rounded bg-[var(--dash-border)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
