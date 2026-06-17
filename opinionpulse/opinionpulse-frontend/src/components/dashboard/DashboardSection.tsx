import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { dashSectionDesc, dashSectionTitle } from "@/lib/dash-classes"

type DashboardSectionProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("mt-[var(--space-8)] first:mt-[var(--space-5)]", className)}>
      <div className="mb-[var(--space-4)] flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <h2 className={dashSectionTitle}>{title}</h2>
          {description && <p className={dashSectionDesc}>{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}
