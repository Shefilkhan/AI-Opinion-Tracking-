import type { LucideIcon } from "lucide-react"
import { proCard, statLabel, statValue } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type StatCardProps = {
  value: string
  label: string
  trend?: string
  trendPositive?: boolean
  icon?: LucideIcon
  progress?: number
  progressColor?: "green" | "red" | "primary"
}

export function StatCard({
  value,
  label,
  trend,
  trendPositive = true,
  icon: Icon,
  progress,
  progressColor = "green",
}: StatCardProps) {
  const progressClass =
    progressColor === "green"
      ? "bg-success"
      : progressColor === "red"
        ? "bg-destructive"
        : "bg-primary"

  return (
    <div className={cn(proCard, "relative px-5 py-5 sm:px-6 sm:py-5 overflow-hidden group hover:scale-[1.02]")}>
      {/* Subtle radial gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {Icon && (
        <div className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] transition-transform duration-300 group-hover:scale-110">
          <Icon className="size-[20px] text-primary" aria-hidden />
        </div>
      )}
      <p className={statValue}>{value}</p>
      <p className={cn(statLabel, "mt-1.5")}>{label}</p>
      {trend ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            trendPositive ? "text-success" : "text-destructive"
          )}
        >
          {trend}
        </p>
      ) : null}
      {progress != null ? (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-300", progressClass)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
