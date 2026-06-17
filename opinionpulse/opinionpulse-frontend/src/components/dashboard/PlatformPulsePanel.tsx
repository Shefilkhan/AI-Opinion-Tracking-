import type { PlatformPulse } from "@/api/dashboard"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { platformBadge } from "@/lib/api/sentiment"
import { dashCardStatic } from "@/lib/dash-classes"
import { platformBrandColor } from "@/lib/platformBrandColors"
import { cn } from "@/lib/utils"

type PlatformPulsePanelProps = {
  items: PlatformPulse[]
}

export function PlatformPulsePanel({ items }: PlatformPulsePanelProps) {
  return (
    <DashboardSection
      title="Social media pulse"
      description="Live sentiment by platform"
    >
      <div className={cn(dashCardStatic, "divide-y divide-[var(--dash-border)] overflow-hidden p-0")}>
        {items.map((p) => {
          const badge = platformBadge(p.platform, p.label)
          const brand = platformBrandColor(p.platform)

          return (
            <div key={p.platform} className="p-4 transition-colors hover:bg-[var(--dash-surface-alt)]/40">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-[11px] text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: brand }}
                >
                  {badge.icon}
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
                  <p className="mt-0.5 truncate text-xs text-[var(--dash-text-faint)]">
                    {p.mentions}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--dash-pos)]">
                  {p.positive_pct}%
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--dash-surface-alt)]">
                <div
                  className="h-full rounded-full bg-[var(--dash-pos)] transition-[width] duration-300"
                  style={{ width: `${p.positive_pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </DashboardSection>
  )
}
