import { Loader2, MessageSquare, RefreshCw } from "lucide-react"
import type { LiveDebateItem } from "@/api/dashboard"
import { DebateCard } from "@/components/dashboard/DebateCard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatUpdatedLabel } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type LiveDebatesProps = {
  debates?: LiveDebateItem[]
  isLoading?: boolean
  isRefreshing?: boolean
  lastUpdated?: string | null
  onRefresh?: () => void
}

function LiveDebatesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn(dashCardStatic, "h-[140px] p-[18px]")}>
          <div className="dash-skeleton mb-3 h-3 w-1/3 rounded bg-[var(--dash-surface-alt)]" />
          <div className="dash-skeleton mb-2 h-4 w-4/5 rounded bg-[var(--dash-surface-alt)]" />
          <div className="dash-skeleton h-3 w-1/2 rounded bg-[var(--dash-surface-alt)]" />
        </div>
      ))}
    </div>
  )
}

export function LiveDebates({
  debates = [],
  isLoading,
  isRefreshing,
  lastUpdated,
  onRefresh,
}: LiveDebatesProps) {
  const headerAction = (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--dash-pos-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--dash-pos)]">
        <span className="size-1.5 rounded-full bg-[var(--dash-pos)]" aria-hidden />
        Live
      </span>
      {isRefreshing && (
        <Loader2 className="size-4 animate-spin text-[var(--dash-text-faint)]" />
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg p-1.5 text-[var(--dash-text-faint)] transition-colors duration-150 hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
          aria-label="Refresh debates"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </button>
      )}
    </div>
  )

  return (
    <DashboardSection
      title="Ongoing debates right now"
      description="Topics with heated discussion on both sides"
      action={headerAction}
    >
      {isLoading ? (
        <LiveDebatesSkeleton />
      ) : debates.length === 0 ? (
        <div className={cn(dashCardStatic, "overflow-hidden")}>
          <DashboardEmptyState
            icon={MessageSquare}
            title="No active debates found right now"
            description="Check back soon — debates update every 5 minutes"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {debates.map((d) => (
            <DebateCard key={d.topic} debate={d} />
          ))}
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
