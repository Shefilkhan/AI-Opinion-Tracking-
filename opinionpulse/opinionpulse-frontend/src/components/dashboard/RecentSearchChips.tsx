import { Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type RecentSearchChipsProps = {
  items: string[]
  onRemove: (query: string) => void
}

export function RecentSearchChips({ items, onRemove }: RecentSearchChipsProps) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent searches yet. Try searching for a topic above.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((q) => (
        <span
          key={q}
          className={cn(proCard, "inline-flex items-center gap-1 rounded-full py-1.5 pl-3 pr-1 text-sm")}
        >
          <button
            type="button"
            onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
          >
            <Search className="size-3.5 text-muted-foreground" />
            {q}
          </button>
          <button
            type="button"
            onClick={() => onRemove(q)}
            className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Remove ${q}`}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  )
}
