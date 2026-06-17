import type { LucideIcon } from "lucide-react"

type DashboardEmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
}: DashboardEmptyStateProps) {
  return (
    <div className="py-12 text-center">
      {Icon ? (
        <Icon
          className="mx-auto mb-3 size-8 text-[var(--dash-text-faint)] opacity-50"
          strokeWidth={1.5}
        />
      ) : (
        <div className="mb-3 text-[32px] opacity-50" aria-hidden>
          📭
        </div>
      )}
      <p className="text-sm font-medium text-[var(--dash-text-mid)]">{title}</p>
      <p className="mt-1 text-[13px] text-[var(--dash-text-faint)]">{description}</p>
    </div>
  )
}
