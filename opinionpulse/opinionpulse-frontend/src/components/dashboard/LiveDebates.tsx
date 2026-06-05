import { Loader2, RefreshCw } from "lucide-react"
import type { LiveDebateItem } from "@/api/dashboard"
import { DebateCard } from "@/components/dashboard/DebateCard"
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
          className="h-32 animate-pulse rounded-xl bg-gray-100"
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
  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          🔥 Ongoing Debates Right Now
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          Live
        </span>
        {isRefreshing && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            aria-label="Refresh debates"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Topics with heated discussion on both sides
      </p>

      {isLoading ? (
        <LiveDebatesSkeleton />
      ) : debates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-[#2d2d44]">
          <p className="text-2xl" aria-hidden>
            💬
          </p>
          <p className="mt-2 font-medium text-foreground">
            No active debates found right now
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — debates update every 5 minutes
          </p>
        </div>
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
    </section>
  )
}
