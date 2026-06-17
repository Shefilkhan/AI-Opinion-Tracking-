import type { ReactNode } from "react"
import { formatUpdatedLabel } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type DashboardPageHeaderProps = {
  title: string
  subtitle: string
  lastUpdated?: string | null
  action?: ReactNode
}

export function DashboardPageHeader({
  title,
  subtitle,
  lastUpdated,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--dash-border)] pb-5",
        "sm:flex-row sm:items-end sm:justify-between"
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--dash-text)] sm:text-[24px]">
          {title}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--dash-text-mid)]">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {action}
        {lastUpdated && (
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface-alt)] px-2.5 py-1 text-[11px] text-[var(--dash-text-faint)]">
            <span
              className="size-1.5 shrink-0 rounded-full bg-[var(--dash-pos)]"
              aria-hidden
            />
            {formatUpdatedLabel(lastUpdated)}
          </div>
        )}
      </div>
    </div>
  )
}
