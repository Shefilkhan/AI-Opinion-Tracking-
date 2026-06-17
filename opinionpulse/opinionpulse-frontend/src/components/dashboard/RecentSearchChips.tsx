import { Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type RecentSearchChipsProps = {
  items: string[]
  onRemove: (query: string) => void
}

export function RecentSearchChips({ items, onRemove }: RecentSearchChipsProps) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--dash-text-mid)]">
        No recent searches yet. Try searching for a topic above.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((q) => (
        <span
          key={q}
          className={cn(
            dashCardStatic,
            "inline-flex items-center gap-1 rounded-full py-1.5 pl-3 pr-1 text-sm shadow-none"
          )}
        >
          <button
            type="button"
            onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
            className="inline-flex items-center gap-1.5 border-none bg-transparent font-medium text-[var(--dash-text)] hover:text-[var(--dash-accent)]"
          >
            <Search className="size-3.5 text-[var(--dash-text-faint)]" strokeWidth={2} />
            {q}
          </button>
          <button
            type="button"
            onClick={() => onRemove(q)}
            className="rounded-full p-1 text-[var(--dash-text-faint)] hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
            aria-label={`Remove ${q}`}
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </span>
      ))}
    </div>
  )
}
