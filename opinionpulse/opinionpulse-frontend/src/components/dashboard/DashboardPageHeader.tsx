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
        "flex flex-col gap-4 border-b border-[var(--dash-border)] pb-[var(--space-6)]",
        "sm:flex-row sm:items-end sm:justify-between"
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-[var(--dash-text)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--dash-text-mid)]">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {action}
        <div className="flex items-center gap-1.5 text-xs text-[var(--dash-text-faint)]">
          <span
            className="size-1.5 shrink-0 rounded-full bg-[var(--dash-pos)]"
            style={{ boxShadow: "0 0 0 3px var(--dash-pos-soft)" }}
            aria-hidden
          />
          {formatUpdatedLabel(lastUpdated)}
        </div>
      </div>
    </div>
  )
}
