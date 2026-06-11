import type { ReactNode } from "react"
import type { SearchFilters } from "@/lib/api/types"
import { SegmentedControl } from "@/components/layout/SegmentedControl"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SearchFiltersBarProps = {
  filters: SearchFilters
  onChange: (next: SearchFilters) => void
}

function FilterRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-xs font-medium text-muted-foreground sm:w-24">
        {label}
      </span>
      {children}
    </div>
  )
}

export function SearchFiltersBar({ filters, onChange }: SearchFiltersBarProps) {
  return (
    <div className={cn(proCard, "flex flex-col gap-4 p-4 sm:p-5")}>
      <FilterRow label="Platform">
        <SegmentedControl
          aria-label="Filter by platform"
          value={filters.platform}
          onChange={(platform) => onChange({ ...filters, platform })}
          options={[
            { value: "all", label: "All" },
            { value: "reddit", label: "Reddit" },
            { value: "youtube", label: "YouTube" },
            { value: "mastodon", label: "Mastodon" },
            { value: "github", label: "GitHub" },
            { value: "stackoverflow", label: "StackOverflow" },
            { value: "tech", label: "Tech Blogs" },
            { value: "news", label: "News Sites" },
          ]}
        />
      </FilterRow>
      <FilterRow label="Time Range">
        <SegmentedControl
          aria-label="Filter by time range"
          value={filters.timeRange}
          onChange={(timeRange) => onChange({ ...filters, timeRange })}
          options={[
            { value: "24h", label: "Last 24h" },
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
          ]}
        />
      </FilterRow>
      <FilterRow label="Sentiment">
        <SegmentedControl
          aria-label="Filter by sentiment"
          value={filters.sentiment}
          onChange={(sentiment) => onChange({ ...filters, sentiment })}
          options={[
            { value: "all", label: "All" },
            { value: "positive", label: "Positive" },
            { value: "negative", label: "Negative" },
            { value: "neutral", label: "Neutral" },
          ]}
        />
      </FilterRow>
      <FilterRow label="Sort by">
        <SegmentedControl
          aria-label="Sort results"
          value={filters.sortBy}
          onChange={(sortBy) => onChange({ ...filters, sortBy })}
          options={[
            { value: "recent", label: "Most Recent" },
            { value: "mentioned", label: "Most Mentioned" },
            { value: "viral", label: "Most Viral" },
          ]}
        />
      </FilterRow>
    </div>
  )
}
