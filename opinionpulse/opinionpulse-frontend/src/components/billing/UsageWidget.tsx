import { Link } from "react-router-dom"
import { useUsage } from "@/hooks/useUsage"
import { cn } from "@/lib/utils"

function UsageWidgetSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--dash-surface-alt)] p-3.5">
      <div className="dash-skeleton mb-2 h-3 w-2/3 rounded bg-[var(--dash-border)]" />
      <div className="dash-skeleton h-[5px] w-full rounded bg-[var(--dash-border)]" />
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
    <div className="mb-3 rounded-xl bg-[var(--dash-surface-alt)] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-[var(--dash-text)]">
          {usage.plan.name} Plan
        </span>
        {!isUnlimited && (
          <span className="text-[11.5px] text-[var(--dash-text-faint)]">
            {searches.used}/{searches.limit}
          </span>
        )}
      </div>

      {!isUnlimited && (
        <div className="mb-2.5 h-[5px] overflow-hidden rounded-sm bg-[var(--dash-border)]">
          <div
            className="h-full rounded-sm bg-[var(--dash-accent)] transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {usage.plan.id === "starter" && (
        <Link
          to="/pricing"
          className={cn(
            "flex w-full items-center justify-center rounded-lg border-none",
            "bg-[var(--dash-accent)] px-2 py-2 text-[12.5px] font-semibold text-white no-underline",
            "transition-opacity duration-150 hover:opacity-90"
          )}
        >
          Upgrade to Pro
        </Link>
      )}
    </div>
  )
}
