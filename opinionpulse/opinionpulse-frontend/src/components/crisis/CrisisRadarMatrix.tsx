import { useMemo, useState } from "react"
import type { CrisisQuadrant, RadarPoint } from "@/api/crisis"
import { CrisisStatusBadge } from "@/components/crisis/CrisisStatusBadge"
import {
  QUADRANT_DISPLAY,
  formatNegativeDelta,
  formatRelativeTime,
  formatVolumeDelta,
  quadrantDisplayLabel,
} from "@/lib/crisis-display"
import { cn } from "@/lib/utils"

const QUADRANT_DOT: Record<CrisisQuadrant, string> = {
  quiet: "bg-emerald-500 shadow-emerald-500/40",
  noise: "bg-orange-400 shadow-orange-400/40",
  watch: "bg-amber-500 shadow-amber-500/40",
  crisis: "bg-red-500 shadow-red-500/50 animate-pulse",
}

type PlacedPoint = RadarPoint & { px: number; py: number }

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
        const angle = Math.atan2(dy, dx) || j * 1.2
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

function MatrixPopover({ point }: { point: PlacedPoint }) {
  return (
    <div className="crisis-matrix-popover" role="tooltip">
      <p className="font-semibold text-[var(--dash-text)]">{point.keyword}</p>
      <CrisisStatusBadge quadrant={point.quadrant} size="sm" className="mt-1" />
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--dash-text-faint)]">Volume</dt>
          <dd className="font-medium text-[var(--dash-text)]">
            {Math.round(point.volume_score)} / 100
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--dash-text-faint)]">Velocity</dt>
          <dd className="font-medium text-[var(--dash-text)]">
            {Math.round(point.velocity_score)} / 100
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--dash-text-faint)]">Mentions</dt>
          <dd className="font-medium text-[var(--dash-text)]">{point.mention_count_30m}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--dash-text-faint)]">Negative</dt>
          <dd className="font-medium text-[var(--dash-text)]">{point.negative_pct_30m}%</dd>
        </div>
        {formatVolumeDelta(point) && (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--dash-text-faint)]">Volume vs baseline</dt>
            <dd>{formatVolumeDelta(point)}</dd>
          </div>
        )}
        {formatNegativeDelta(point) && (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--dash-text-faint)]">Negativity vs normal</dt>
            <dd>{formatNegativeDelta(point)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[10px] text-[var(--dash-text-faint)]">
        Last scanned {formatRelativeTime(point.last_scanned_at)}
      </p>
    </div>
  )
}

export function CrisisRadarMatrix({ points, selectedId, onSelect }: CrisisRadarMatrixProps) {
  const placed = useMemo(() => layoutPoints(points), [points])
  const [hoverId, setHoverId] = useState<string | null>(null)

  return (
    <div className="crisis-radar-chart crisis-radar-chart-lg">
      <div className="crisis-radar-y-axis">
        <span className="crisis-radar-axis-title">Negative velocity</span>
        <span className="crisis-radar-axis-hint">↑ faster negativity</span>
      </div>

      <div className="crisis-radar-plot">
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
            <span className="crisis-radar-quadrant-label">Normal</span>
            <span className="crisis-radar-quadrant-desc">Stable</span>
          </div>
          <div className="crisis-radar-quadrant crisis-radar-quadrant-noise">
            <span className="crisis-radar-quadrant-label">High Activity</span>
            <span className="crisis-radar-quadrant-desc">High conversation</span>
          </div>
        </div>

        <div className="crisis-radar-crosshair-h" aria-hidden />
        <div className="crisis-radar-crosshair-v" aria-hidden />

        {placed.map((point) => {
          const selected = point.watch_id === selectedId
          const hovered = point.watch_id === hoverId
          const unscanned = !point.last_scanned_at
          return (
            <button
              key={point.watch_id}
              type="button"
              className={cn(
                "crisis-radar-point group",
                selected && "crisis-radar-point-selected",
                hovered && "crisis-radar-point-hover"
              )}
              style={{ left: `${point.px}%`, top: `${point.py}%` }}
              onClick={() => onSelect(point.watch_id)}
              onMouseEnter={() => setHoverId(point.watch_id)}
              onMouseLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(point.watch_id)}
              onBlur={() => setHoverId(null)}
              aria-label={`${point.keyword}, ${quadrantDisplayLabel(point.quadrant)}`}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "crisis-radar-dot",
                  QUADRANT_DOT[point.quadrant],
                  selected && "crisis-radar-dot-selected"
                )}
              />
              <span className="crisis-radar-label">
                {point.keyword}
                {unscanned && (
                  <span className="block text-[9px] font-normal opacity-70">Not scanned</span>
                )}
              </span>
              {hovered && <MatrixPopover point={point} />}
            </button>
          )
        })}
      </div>

      <div className="crisis-radar-x-axis">
        <span className="crisis-radar-axis-title">Volume →</span>
        <span className="crisis-radar-axis-hint">mentions in last 30 min</span>
      </div>
    </div>
  )
}

export function CrisisQuadrantBadge({ quadrant }: { quadrant: CrisisQuadrant }) {
  return <CrisisStatusBadge quadrant={quadrant} size="sm" />
}

export function CrisisLegendGrid() {
  const items: CrisisQuadrant[] = ["quiet", "watch", "noise", "crisis"]
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((quadrant) => (
        <div
          key={quadrant}
          className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2.5"
        >
          <CrisisStatusBadge quadrant={quadrant} size="sm" />
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--dash-text-faint)]">
            {QUADRANT_DISPLAY[quadrant].description}
          </p>
        </div>
      ))}
    </div>
  )
}
