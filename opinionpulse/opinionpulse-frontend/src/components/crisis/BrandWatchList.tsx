import { Link } from "react-router-dom"
import { MoreHorizontal, Search, Sparkles } from "lucide-react"
import type { RadarPoint } from "@/api/crisis"
import { CrisisStatusBadge } from "@/components/crisis/CrisisStatusBadge"
import {
  buildPulseAiUrl,
  formatRelativeTime,
  quadrantSeverityClass,
} from "@/lib/crisis-display"
import { cn } from "@/lib/utils"
import { proCard } from "@/lib/ui-classes"

type BrandWatchListProps = {
  points: RadarPoint[]
  selectedId: string | null
  onSelect: (watchId: string) => void
  sticky?: boolean
}

export function BrandWatchList({
  points,
  selectedId,
  onSelect,
  sticky = true,
}: BrandWatchListProps) {
  return (
    <section
      className={cn(
        proCard,
        "crisis-watch-panel p-4 sm:p-5",
        sticky && "xl:sticky xl:top-4 xl:self-start"
      )}
    >
      <h3 className="crisis-section-label m-0 mb-3">Monitored topics</h3>
      <ul className="space-y-2">
        {points.map((p) => {
          const selected = selectedId === p.watch_id
          return (
            <li key={p.watch_id}>
              <button
                type="button"
                onClick={() => onSelect(p.watch_id)}
                className={cn(
                  "crisis-watch-card group w-full text-left",
                  quadrantSeverityClass(p.quadrant),
                  selected && "crisis-watch-card-selected"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--dash-text)]">
                      {p.name || p.keyword}
                    </p>
                    <CrisisStatusBadge quadrant={p.quadrant} size="sm" className="mt-1.5" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="crisis-mini-label">Volume</p>
                    <p className="crisis-mini-value">{Math.round(p.volume_score)}</p>
                  </div>
                  <div>
                    <p className="crisis-mini-label">Velocity</p>
                    <p className="crisis-mini-value">{Math.round(p.velocity_score)}</p>
                  </div>
                  <div>
                    <p className="crisis-mini-label">Negative</p>
                    <p className="crisis-mini-value">{p.negative_pct_30m}%</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-[var(--dash-text-faint)]">
                  Updated {formatRelativeTime(p.last_scanned_at)}
                </p>
                <div className="crisis-watch-actions mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Link
                    to={`/search?q=${encodeURIComponent(p.keyword)}`}
                    className="crisis-watch-action"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Search className="size-3" />
                    Search
                  </Link>
                  <Link
                    to={buildPulseAiUrl(p.keyword, p.quadrant)}
                    className="crisis-watch-action"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Sparkles className="size-3" />
                    Pulse
                  </Link>
                  <span className="crisis-watch-action cursor-default">
                    <MoreHorizontal className="size-3" />
                    More
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
