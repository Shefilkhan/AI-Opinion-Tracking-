import type { LucideIcon } from "lucide-react"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  value: string
  subtitle: string
  trend?: string
  trendPositive?: boolean
  icon: LucideIcon
  progress?: number
  progressColor?: "green" | "red"
}

export function MetricCard({
  value,
  subtitle,
  trend,
  trendPositive = true,
  icon: Icon,
  progress,
  progressColor = "green",
}: MetricCardProps) {
  return (
    <div className={cn(proCard, "relative px-6 py-5")}>
      <div className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-[18px] text-primary" aria-hidden />
      </div>
      <p className="text-[28px] font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
      {trend ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            trendPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {trend}
        </p>
      ) : null}
      {progress != null ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progressColor === "green" ? "bg-green-500" : "bg-red-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
