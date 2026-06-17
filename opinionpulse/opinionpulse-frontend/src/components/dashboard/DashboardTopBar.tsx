import { FormEvent, useState } from "react"
import { Bell, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatUpdatedLabel } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type DashboardTopBarProps = {
  mobileMenu?: React.ReactNode
  lastUpdated?: string | null
  isLive?: boolean
}

export function DashboardTopBar({
  mobileMenu,
  lastUpdated,
  isLive = true,
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
      <div className="flex items-center gap-3 px-5 py-3 sm:gap-4 sm:px-8 lg:px-10">
        {mobileMenu}

        <form onSubmit={handleSubmit} className="min-w-0 flex-1">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--dash-text-faint)]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, sources, reports…"
              className={cn(
                "h-10 w-full rounded-[var(--dash-radius)] border border-[var(--dash-border)]",
                "bg-[var(--dash-surface-alt)] pl-10 pr-4 text-[13px] text-[var(--dash-text)]",
                "placeholder:text-[var(--dash-text-faint)]",
                "outline-none transition-[border-color,box-shadow] duration-150",
                "focus:border-[var(--dash-accent-border)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
              )}
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-mid)] transition-colors hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
            aria-label="Notifications"
          >
            <Bell className="size-4" strokeWidth={2} />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                isLive
                  ? "border-[var(--dash-pos-soft)] bg-[var(--dash-pos-soft)] text-[var(--dash-pos)]"
                  : "border-[var(--dash-border)] bg-[var(--dash-surface-alt)] text-[var(--dash-text-faint)]"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isLive ? "bg-[var(--dash-pos)]" : "bg-[var(--dash-text-faint)]"
                )}
                aria-hidden
              />
              Live
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-[var(--dash-text-faint)]">
                {formatUpdatedLabel(lastUpdated)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
