import type { LucideIcon } from "lucide-react"
import { dashCardStatic } from "@/lib/dash-classes"
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
  return (
    <div className={cn(dashCardStatic, "p-4 sm:p-[18px]")}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--dash-text-faint)]">
          {label}
        </span>
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-[var(--dash-radius-sm)]"
          style={{ background: iconBg }}
        >
          <Icon className="size-3.5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
      </div>

      <div className="text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--dash-text)] sm:text-[30px]">
        {value}
      </div>

      <p className="mt-2 text-[12px] leading-snug text-[var(--dash-text-mid)]">
        {description}
      </p>

      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[var(--dash-surface-alt)]">
        <div
          className="h-full rounded-full"
          style={{ width: barWidth, background: barColor }}
        />
      </div>
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className={cn(dashCardStatic, "h-[118px] p-4 sm:p-[18px]")}>
      <div className="dash-skeleton mb-3 h-3 w-[55%] rounded bg-[var(--dash-surface-alt)]" />
      <div className="dash-skeleton h-7 w-[35%] rounded bg-[var(--dash-surface-alt)]" />
      <div className="dash-skeleton mt-4 h-[3px] w-full rounded-full bg-[var(--dash-surface-alt)]" />
    </div>
  )
}
