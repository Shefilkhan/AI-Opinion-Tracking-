import type { SearchFilters } from "@/lib/api/types"
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
              ? "border-transparent bg-purple-600 text-white dark:bg-purple-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-purple-300 dark:border-[#2d2d44] dark:bg-[#1e1e30] dark:text-gray-300 dark:hover:border-purple-500"
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
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-[#2d2d44] dark:bg-[#1e1e30]">
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
