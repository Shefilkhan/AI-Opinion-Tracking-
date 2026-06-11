import type { ReactNode } from "react"
import { sectionDescription, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type PageSectionProps = {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  band?: boolean
}

export function PageSection({
  title,
  description,
  action,
  children,
  className,
  band = false,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "mb-8 last:mb-0",
        band && "rounded-[var(--radius-lg)] border border-border bg-muted/30 px-5 py-6 sm:px-6",
        className
      )}
    >
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className={sectionTitle}>{title}</h2>}
            {description && (
              <p className={cn(sectionDescription, title && "mt-1")}>{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
