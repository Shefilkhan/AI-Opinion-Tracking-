import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { inputSurface, selectSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export type MentionFilterValues = {
  source: string
  sentiment: string
  search: string
}

type MentionFiltersProps = {
  values: MentionFilterValues
  onChange: (values: MentionFilterValues) => void
}

export function MentionFilters({ values, onChange }: MentionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        value={values.sentiment}
        onChange={(e) => onChange({ ...values, sentiment: e.target.value })}
        className={cn(selectSurface, "sm:w-44")}
        aria-label="Filter by sentiment"
      >
        <option value="all">All sentiments</option>
        <option value="positive">Positive</option>
        <option value="neutral">Neutral</option>
        <option value="negative">Negative</option>
        <option value="unanalyzed">Unanalyzed</option>
      </select>
      <select
        value={values.source}
        onChange={(e) => onChange({ ...values, source: e.target.value })}
        className={cn(selectSurface, "sm:w-40")}
        aria-label="Filter by source"
      >
        <option value="all">All sources</option>
        <option value="manual">Manual</option>
        <option value="reddit">Reddit</option>
        <option value="youtube">YouTube</option>
        <option value="gdelt">GDELT</option>
        <option value="hackernews">Hacker News</option>
      </select>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search mention text…"
          value={values.search}
          onChange={(e) => onChange({ ...values, search: e.target.value })}
          className={cn(inputSurface, "pl-9")}
        />
      </div>
    </div>
  )
}
