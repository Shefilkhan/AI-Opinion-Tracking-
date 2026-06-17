import type { PlatformPulse } from "@/api/dashboard"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type PlatformPulsePanelProps = {
  items: PlatformPulse[]
}

export function PlatformPulsePanel({ items }: PlatformPulsePanelProps) {
  return (
    <DashboardSection title="Social media pulse">
      <div className={cn(dashCardStatic, "p-5")}>
        <ul className="space-y-5">
          {items.map((p) => (
            <li key={p.platform}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--dash-accent-soft)] text-sm font-semibold text-[var(--dash-accent)]">
                  {p.label.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--dash-text)]">
                      {p.label}
                    </p>
                    {p.live !== undefined && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          p.live
                            ? "bg-[var(--dash-pos-soft)] text-[var(--dash-pos)]"
                            : "bg-[var(--dash-surface-alt)] text-[var(--dash-text-faint)]"
                        )}
                      >
                        {p.live ? "Live" : "Demo"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--dash-text-faint)]">{p.mentions}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--dash-text-faint)]">Sentiment</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[var(--dash-surface-alt)]">
                  <div
                    className="h-full rounded-sm bg-[var(--dash-pos)]"
                    style={{ width: `${p.positive_pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[var(--dash-pos)]">
                  {p.positive_pct}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardSection>
  )
}
