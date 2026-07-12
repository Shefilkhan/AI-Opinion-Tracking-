import { useMemo } from "react"
import type { CrisisQuadrant, RadarPoint } from "@/api/crisis"
import { cn } from "@/lib/utils"

const QUADRANT_DOT: Record<CrisisQuadrant, string> = {
  quiet: "bg-emerald-500 shadow-emerald-500/30",
  noise: "bg-amber-400 shadow-amber-400/30",
  watch: "bg-orange-500 shadow-orange-500/30",
  crisis: "bg-red-500 shadow-red-500/40 animate-pulse",
}

const QUADRANT_BADGE: Record<CrisisQuadrant, string> = {
  quiet: "bg-emerald-600/90",
  noise: "bg-amber-500/90",
  watch: "bg-orange-500/90",
  crisis: "bg-red-600/90",
}

type PlacedPoint = RadarPoint & { px: number; py: number }

/** Spread overlapping dots (e.g. unscanned 0/0 watches) in the quiet quadrant. */
function layoutPoints(points: RadarPoint[]): PlacedPoint[] {
  const placed: PlacedPoint[] = points.map((point, index) => {
    const baseX = point.volume_score > 0 ? point.volume_score : 12 + (index % 3) * 14
    const baseY = point.velocity_score > 0 ? 100 - point.velocity_score : 78 - (index % 2) * 12
    return {
      ...point,
      px: Math.min(94, Math.max(6, baseX)),
      py: Math.min(94, Math.max(6, baseY)),
    }
  })

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const dx = placed[j].px - placed[i].px
      const dy = placed[j].py - placed[i].py
      const dist = Math.hypot(dx, dy)
      if (dist < 14) {
        const angle = Math.atan2(dy, dx) || (j * 1.2)
        placed[j].px = Math.min(94, Math.max(6, placed[i].px + Math.cos(angle) * 16))
        placed[j].py = Math.min(94, Math.max(6, placed[i].py + Math.sin(angle) * 16))
      }
    }
  }
  return placed
}

type CrisisRadarMatrixProps = {
  points: RadarPoint[]
  selectedId: string | null
  onSelect: (watchId: string) => void
}

export function CrisisRadarMatrix({ points, selectedId, onSelect }: CrisisRadarMatrixProps) {
  const placed = useMemo(() => layoutPoints(points), [points])

  return (
    <div className="crisis-radar-chart">
      {/* Y-axis */}
      <div className="crisis-radar-y-axis">
        <span className="crisis-radar-axis-title">Velocity</span>
        <span className="crisis-radar-axis-hint">↑ faster negativity</span>
      </div>

      <div className="crisis-radar-plot">
        {/* Quadrant backgrounds */}
        <div className="crisis-radar-grid" aria-hidden>
          <div className="crisis-radar-quadrant crisis-radar-quadrant-watch">
            <span className="crisis-radar-quadrant-label">Watch</span>
            <span className="crisis-radar-quadrant-desc">Early warning</span>
          </div>
          <div className="crisis-radar-quadrant crisis-radar-quadrant-crisis">
            <span className="crisis-radar-quadrant-label">Crisis</span>
            <span className="crisis-radar-quadrant-desc">Act now</span>
          </div>
          <div className="crisis-radar-quadrant crisis-radar-quadrant-quiet">
            <span className="crisis-radar-quadrant-label">Quiet</span>
            <span className="crisis-radar-quadrant-desc">Normal</span>
          </div>
          <div className="crisis-radar-quadrant crisis-radar-quadrant-noise">
            <span className="crisis-radar-quadrant-label">Noise</span>
            <span className="crisis-radar-quadrant-desc">High volume</span>
          </div>
        </div>

        {/* Crosshair midlines */}
        <div className="crisis-radar-crosshair-h" aria-hidden />
        <div className="crisis-radar-crosshair-v" aria-hidden />

        {/* Data points + labels (HTML for readability) */}
        {placed.map((point) => {
          const selected = point.watch_id === selectedId
          const unscanned = point.volume_score === 0 && point.velocity_score === 0
          return (
            <button
              key={point.watch_id}
              type="button"
              className={cn(
                "crisis-radar-point group",
                selected && "crisis-radar-point-selected"
              )}
              style={{ left: `${point.px}%`, top: `${point.py}%` }}
              onClick={() => onSelect(point.watch_id)}
              title={`${point.keyword} — ${point.status_label}`}
            >
              <span
                className={cn(
                  "crisis-radar-dot shadow-lg",
                  QUADRANT_DOT[point.quadrant],
                  selected && "ring-2 ring-[var(--dash-accent)] ring-offset-2 ring-offset-[var(--dash-surface)]"
                )}
              />
              <span className="crisis-radar-label">
                {point.keyword}
                {unscanned && (
                  <span className="block text-[9px] font-normal opacity-70">Not scanned</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* X-axis */}
      <div className="crisis-radar-x-axis">
        <span className="crisis-radar-axis-title">Volume →</span>
        <span className="crisis-radar-axis-hint">mentions in last 30 min</span>
      </div>
    </div>
  )
}

export function CrisisQuadrantBadge({ quadrant }: { quadrant: CrisisQuadrant }) {
  const labels: Record<CrisisQuadrant, string> = {
    quiet: "Normal",
    noise: "Noise",
    watch: "Watch",
    crisis: "Crisis",
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white",
        QUADRANT_BADGE[quadrant]
      )}
    >
      {labels[quadrant]}
    </span>
  )
}

export function CrisisLegendGrid() {
  const items: { quadrant: CrisisQuadrant; title: string; desc: string }[] = [
    { quadrant: "quiet", title: "Quiet", desc: "Normal activity — no action needed" },
    { quadrant: "watch", title: "Watch", desc: "Negativity accelerating — monitor closely" },
    { quadrant: "noise", title: "Noise", desc: "Lots of talk, stable sentiment" },
    { quadrant: "crisis", title: "Crisis", desc: "High volume + rapid acceleration" },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.quadrant}
          className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2"
        >
          <CrisisQuadrantBadge quadrant={item.quadrant} />
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--dash-text-faint)]">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  )
}
