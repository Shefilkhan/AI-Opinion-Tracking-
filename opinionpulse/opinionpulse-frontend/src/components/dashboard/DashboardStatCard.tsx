import type { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { dashCard } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type DashboardStatCardProps = {
  label: string
  value: string
  description: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  barWidth: string
  barColor: string
}

function parseNumericValue(raw: string): number | null {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : null
}

export function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  barWidth,
  barColor,
}: DashboardStatCardProps) {
  const target = parseNumericValue(value)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (target == null || value.includes("%")) {
      setDisplay(value)
      return
    }
    const duration = 1000
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(String(Math.round(target * eased)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, value])

  return (
    <div className={cn(dashCard, "p-[18px] px-5")}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.03em] text-[var(--dash-text-faint)]">
          {label}
        </span>
        <div
          className="flex size-[26px] items-center justify-center rounded-[7px]"
          style={{ background: iconBg }}
        >
          <Icon className="size-4" style={{ color: iconColor }} strokeWidth={2} />
        </div>
      </div>

      <div className="mb-1.5 text-[30px] font-bold leading-none tracking-[-0.02em] text-[var(--dash-text)]">
        {display}
      </div>

      <p className="mb-2.5 text-[12.5px] text-[var(--dash-text-mid)]">{description}</p>

      <div className="h-1 overflow-hidden rounded-sm bg-[var(--dash-surface-alt)]">
        <div
          className="h-full rounded-sm transition-[width] duration-500 ease-out"
          style={{ width: barWidth, background: barColor }}
        />
      </div>
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className={cn(dashCard, "h-[108px] p-[18px] px-5")}>
      <div className="dash-skeleton mb-3.5 h-3 w-[60%] rounded bg-[var(--dash-surface-alt)]" />
      <div className="dash-skeleton h-7 w-[40%] rounded bg-[var(--dash-surface-alt)]" />
    </div>
  )
}
