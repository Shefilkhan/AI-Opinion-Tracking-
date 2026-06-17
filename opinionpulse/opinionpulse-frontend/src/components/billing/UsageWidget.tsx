import { Link } from "react-router-dom"
import { useUsage } from "@/hooks/useUsage"
import { cn } from "@/lib/utils"

function UsageWidgetSkeleton() {
  return (
    <div className="rounded-[var(--dash-radius-sm)] bg-[var(--dash-surface-alt)] p-3.5">
      <div className="dash-skeleton mb-2 h-3 w-2/3 rounded bg-[var(--dash-border)]" />
      <div className="dash-skeleton h-1 w-full rounded-full bg-[var(--dash-border)]" />
    </div>
  )
}

export function UsageWidget() {
  const { usage, loading } = useUsage()

  if (loading) return <UsageWidgetSkeleton />
  if (!usage) return null

  const { searches } = usage.usage
  const isUnlimited = searches.limit === -1
  const percent =
    !isUnlimited && searches.limit > 0
      ? Math.min(100, Math.round((searches.used / searches.limit) * 100))
      : 0

  return (
    <div className="mb-3 rounded-[var(--dash-radius-sm)] bg-[var(--dash-accent)] p-3.5 text-white">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-[0.02em]">
          {usage.plan.name} Plan
        </span>
        {!isUnlimited && (
          <span className="text-[11px] text-white/70">
            {searches.used}/{searches.limit}
          </span>
        )}
      </div>

      {!isUnlimited && (
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[var(--dash-chart-yellow)] transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {usage.plan.id === "starter" && (
        <Link
          to="/pricing"
          className={cn(
            "flex w-full items-center justify-center rounded-full",
            "bg-white px-2 py-2 text-[12px] font-semibold text-[var(--dash-accent)] no-underline",
            "transition-opacity duration-150 hover:opacity-90"
          )}
        >
          Upgrade to Pro
        </Link>
      )}
    </div>
  )
}
