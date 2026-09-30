import type { RadarPoint } from "@/api/crisis"
import { buildWhatChanged } from "@/lib/crisis-display"
import { proCard } from "@/lib/ui-classes"

type WhatChangedPanelProps = {
  point: RadarPoint
}

export function WhatChangedPanel({ point }: WhatChangedPanelProps) {
  const items = buildWhatChanged(point)
  if (items.length === 0) return null

  return (
    <section className={`${proCard} p-5 sm:p-6`}>
      <h3 className="crisis-section-label m-0">What changed?</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3"
          >
            <p className="crisis-mini-label">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-[var(--dash-text)]">
              {item.from !== "—" ? `${item.from} → ${item.to}` : item.to}
            </p>
            <p className="mt-0.5 text-xs text-[var(--dash-text-faint)]">{item.delta}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
