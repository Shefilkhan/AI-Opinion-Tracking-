import type { CrisisQuadrant } from "@/api/crisis"
import { cn } from "@/lib/utils"
import { quadrantDisplayLabel, quadrantSeverityClass } from "@/lib/crisis-display"

type CrisisStatusBadgeProps = {
  quadrant: CrisisQuadrant
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function CrisisStatusBadge({
  quadrant,
  size = "md",
  showIcon = true,
  className,
}: CrisisStatusBadgeProps) {
  const label = quadrantDisplayLabel(quadrant)
  return (
    <span
      className={cn(
        "crisis-status-badge inline-flex items-center gap-1.5 font-semibold",
        quadrantSeverityClass(quadrant),
        size === "sm" && "crisis-status-badge-sm",
        size === "lg" && "crisis-status-badge-lg",
        className
      )}
    >
      {showIcon && <span className="crisis-status-dot" aria-hidden />}
      {label}
    </span>
  )
}
