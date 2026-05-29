import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export type MentionFilterValues = {
  source: string
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
        value={values.source}
        onChange={(e) => onChange({ ...values, source: e.target.value })}
        className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-sm text-white sm:w-40"
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
          className="border-slate-700 bg-slate-950 pl-9"
        />
      </div>
    </div>
  )
}
