import { Link } from "react-router-dom"
import { Sparkles } from "lucide-react"
import { useUsage } from "@/hooks/useUsage"
import { cn } from "@/lib/utils"

export function PlanTopBarBadge() {
  const { usage, loading } = useUsage()

  if (loading || !usage) return null

  const { searches } = usage.usage
  const isUnlimited = searches.limit === -1
  const isStarter = usage.plan.id === "starter"
  const href = isStarter ? "/pricing" : "/settings#billing"

  return (
    <Link
      to={href}
      className={cn(
        "inline-flex max-w-[11rem] items-center gap-2 rounded-full border px-3 py-1.5 no-underline transition-colors",
        "border-[var(--dash-accent-border)] bg-[var(--dash-accent-soft)]",
        "hover:bg-[var(--dash-accent)] hover:text-white hover:border-[var(--dash-accent)]",
        "group"
      )}
      title={`${usage.plan.name} plan${!isUnlimited ? ` · ${searches.used}/${searches.limit} searches` : ""}`}
    >
      <Sparkles
        className="size-3.5 shrink-0 text-[var(--dash-accent)] group-hover:text-white"
        strokeWidth={2}
        aria-hidden
      />
      <span className="truncate text-[11px] font-semibold text-[var(--dash-accent)] group-hover:text-white">
        {usage.plan.name}
      </span>
      {!isUnlimited && (
        <span className="shrink-0 text-[10px] font-medium text-[var(--dash-text-mid)] group-hover:text-white/80">
          {searches.used}/{searches.limit}
        </span>
      )}
      {isStarter && (
        <span className="shrink-0 rounded-full bg-[var(--dash-accent)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white group-hover:bg-white group-hover:text-[var(--dash-accent)]">
          Pro
        </span>
      )}
    </Link>
  )
}
