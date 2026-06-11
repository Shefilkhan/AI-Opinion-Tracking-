import { Loader2, MessageSquare, RefreshCw } from "lucide-react"
import type { LiveDebateItem } from "@/api/dashboard"
import { DebateCard } from "@/components/dashboard/DebateCard"
import { EmptyState } from "@/components/layout/EmptyState"
import { PageSection } from "@/components/layout/PageSection"
import { StatusPill } from "@/components/layout/StatusPill"
import { cn } from "@/lib/utils"

type LiveDebatesProps = {
  debates?: LiveDebateItem[]
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

function LiveDebatesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-muted"
        />
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
      <StatusPill label="Live" live />
      {isRefreshing && (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Refresh debates"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </button>
      )}
    </div>
  )

  return (
    <PageSection
      title="Ongoing Debates Right Now"
      description="Topics with heated discussion on both sides"
      action={headerAction}
    >
      {isLoading ? (
        <LiveDebatesSkeleton />
      ) : debates.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No active debates found right now"
          description="Check back soon — debates update every 5 minutes"
          compact
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {debates.map((d) => (
            <DebateCard key={d.topic} debate={d} />
          ))}
        </div>
      )}

      {lastUpdated && (
        <p className="mt-3 text-xs text-muted-foreground">
          {formatUpdatedAgo(lastUpdated)}
        </p>
      )}
    </PageSection>
  )
}
