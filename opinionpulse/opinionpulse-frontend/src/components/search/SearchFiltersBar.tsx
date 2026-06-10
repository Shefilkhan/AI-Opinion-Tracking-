import type { SearchFilters } from "@/lib/api/types"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SearchFiltersBarProps = {
  filters: SearchFilters
  onChange: (next: SearchFilters) => void
}

function FilterGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string
  options: { id: string; label: string }[]
  value: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
            value === o.id
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SearchFiltersBar({ filters, onChange }: SearchFiltersBarProps) {
  return (
    <div className={cn(proCard, "flex flex-col gap-4 p-4 sm:p-5")}>
      <FilterGroup
        label="Platform"
        value={filters.platform}
        onSelect={(platform) => onChange({ ...filters, platform })}
        options={[
          { id: "all", label: "All" },
          { id: "reddit", label: "Reddit" },
          { id: "youtube", label: "YouTube" },
          { id: "news", label: "News" },
          { id: "tech", label: "Tech" },
        ]}
      />
      <FilterGroup
        label="Time Range"
        value={filters.timeRange}
        onSelect={(timeRange) => onChange({ ...filters, timeRange })}
        options={[
          { id: "24h", label: "Last 24h" },
          { id: "7d", label: "Last 7 days" },
          { id: "30d", label: "Last 30 days" },
        ]}
      />
      <FilterGroup
        label="Sentiment"
        value={filters.sentiment}
        onSelect={(sentiment) => onChange({ ...filters, sentiment })}
        options={[
          { id: "all", label: "All" },
          { id: "positive", label: "Positive" },
          { id: "negative", label: "Negative" },
          { id: "neutral", label: "Neutral" },
        ]}
      />
      <FilterGroup
        label="Sort by"
        value={filters.sortBy}
        onSelect={(sortBy) => onChange({ ...filters, sortBy })}
        options={[
          { id: "recent", label: "Most Recent" },
          { id: "mentioned", label: "Most Mentioned" },
          { id: "viral", label: "Most Viral" },
        ]}
      />
    </div>
  )
}
