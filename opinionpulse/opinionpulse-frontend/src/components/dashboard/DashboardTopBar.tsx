import { type FormEvent, useState } from "react"
import { Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { PlanTopBarBadge } from "@/components/billing/PlanTopBarBadge"
import { ProfileMenu } from "@/components/layout/ProfileMenu"
import { NotificationPanel } from "@/components/notifications/NotificationPanel"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { formatUpdatedLabel } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type DashboardTopBarProps = {
  mobileMenu?: React.ReactNode
  lastUpdated?: string | null
  isLive?: boolean
  pageTitle?: string
}

export function DashboardTopBar({
  mobileMenu,
  lastUpdated,
  isLive = true,
  pageTitle = "Overview",
}: DashboardTopBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
    else navigate("/search")
  }

  return (
    <div className="sticky top-0 z-40 shrink-0 border-b border-[var(--dash-border)] bg-[var(--dash-surface)]/95 backdrop-blur-md">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {mobileMenu}
          <div className="min-w-0">
            <h1 className="font-serif-display truncate text-[22px] font-semibold text-[var(--dash-text)] sm:text-2xl">
              {pageTitle}
            </h1>
            {lastUpdated && (
              <p className="mt-0.5 hidden text-xs text-[var(--dash-text-faint)] sm:block">
                Updated {formatUpdatedLabel(lastUpdated)}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="min-w-0 flex-1 sm:max-w-md sm:mx-auto lg:max-w-lg">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[var(--dash-text-faint)]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for something"
              className={cn(
                "h-11 w-full rounded-full border border-[var(--dash-border)]",
                "bg-[var(--dash-surface-alt)] pl-11 pr-4 text-sm text-[var(--dash-text)]",
                "placeholder:text-[var(--dash-text-faint)]",
                "outline-none transition-[border-color,box-shadow] duration-150",
                "focus:border-[var(--dash-accent-border)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
              )}
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <PlanTopBarBadge />

          <span
            className={cn(
              "mr-1 hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex",
              isLive
                ? "border-[var(--dash-pos-soft)] bg-[var(--dash-pos-soft)] text-[var(--dash-chart-teal)]"
                : "border-[var(--dash-border)] bg-[var(--dash-surface-alt)] text-[var(--dash-text-faint)]"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isLive ? "bg-[var(--dash-chart-teal)]" : "bg-[var(--dash-text-faint)]"
              )}
              aria-hidden
            />
            Live
          </span>

          <ThemeToggle className="hidden sm:inline-flex" />

          <NotificationPanel />

          <ProfileMenu />
        </div>
      </div>
    </div>
  )
}
