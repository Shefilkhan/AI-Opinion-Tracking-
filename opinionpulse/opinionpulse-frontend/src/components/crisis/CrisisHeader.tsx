import { useState } from "react"
import { CircleHelp, Radio } from "lucide-react"
import type { RadarPoint } from "@/api/crisis"
import { countCrisis, countElevated, formatRelativeTime } from "@/lib/crisis-display"
import { cn } from "@/lib/utils"
import { proCard } from "@/lib/ui-classes"

type CrisisHeaderProps = {
  points: RadarPoint[]
  lastUpdated: string
  scanIntervalMinutes: number
  isLive?: boolean
}

export function CrisisHeader({
  points,
  lastUpdated,
  scanIntervalMinutes,
  isLive = true,
}: CrisisHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false)
  const elevated = countElevated(points)
  const crisis = countCrisis(points)

  return (
    <header className={cn(proCard, "crisis-header p-5 sm:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="crisis-page-title m-0 text-[var(--dash-text)]">Crisis Radar</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--dash-text-mid)]">
            <span>
              <strong className="text-[var(--dash-text)]">{points.length}</strong> monitored topic
              {points.length === 1 ? "" : "s"}
            </span>
            <span className="text-[var(--dash-text-faint)]">·</span>
            <span>
              <strong className="text-[var(--dash-text)]">{elevated}</strong> elevated
            </span>
            <span className="text-[var(--dash-text-faint)]">·</span>
            <span>
              <strong className={crisis > 0 ? "text-red-600" : "text-[var(--dash-text)]"}>
                {crisis}
              </strong>{" "}
              crisis
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          {isLive && (
            <span className="crisis-live-pill inline-flex items-center gap-1.5 text-xs font-medium">
              <Radio className="size-3.5" aria-hidden />
              Live
            </span>
          )}
          <p className="m-0 text-xs text-[var(--dash-text-faint)]">
            Updated {formatRelativeTime(lastUpdated)}
          </p>
          <p className="m-0 text-xs text-[var(--dash-text-faint)]">
            Next scan in ~{scanIntervalMinutes} min
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dash-border)] pt-4">
        <button
          type="button"
          className="crisis-info-trigger inline-flex items-center gap-1.5 text-xs font-medium text-[var(--dash-text-mid)] transition-colors hover:text-[var(--dash-accent)]"
          onClick={() => setInfoOpen((v) => !v)}
          aria-expanded={infoOpen}
        >
          <CircleHelp className="size-3.5" />
          How Crisis Radar works
        </button>
        {infoOpen && (
          <div className="crisis-info-panel mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Volume",
                body: "Recent conversation activity compared with your baseline (last 30 min).",
              },
              {
                title: "Velocity",
                body: "How quickly negative conversation is accelerating vs baseline.",
              },
              {
                title: "Quadrants",
                body: "Normal · Watch · High Activity · Crisis — based on volume + velocity thresholds.",
              },
              {
                title: "Scans",
                body: `Auto-scan every ${scanIntervalMinutes} min. Use Scan Now for an immediate refresh.`,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2.5"
              >
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--dash-text)]">
                  {item.title}
                </p>
                <p className="mt-1 mb-0 text-xs leading-relaxed text-[var(--dash-text-faint)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
