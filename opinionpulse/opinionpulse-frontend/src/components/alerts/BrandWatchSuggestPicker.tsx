import { CheckCircle2, Loader2, Radio, Search } from "lucide-react"
import type { BrandWatchSuggestOption } from "@/api/brandWatches"
import { platformBadge } from "@/lib/api/sentiment"
import { inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type BrandWatchSuggestPickerProps = {
  query: string
  options: BrandWatchSuggestOption[]
  loading: boolean
  selectedId: string | null
  onSelect: (option: BrandWatchSuggestOption) => void
}

export function BrandWatchSuggestPicker({
  query,
  options,
  loading,
  selectedId,
  onSelect,
}: BrandWatchSuggestPickerProps) {
  if (query.trim().length < 2) {
    return (
      <p className="text-xs text-muted-foreground">
        Type a brand, product, or keyword — we&apos;ll search live sources and show matches.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Searching live sources for &ldquo;{query.trim()}&rdquo;…
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-3 text-sm text-muted-foreground">
        No live mentions found for &ldquo;{query.trim()}&rdquo;. Try a different spelling or broader keyword.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Pick a match from live sources
      </p>
      <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {options.map((option) => {
          const selected = selectedId === option.id
          const live = option.has_live_data
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => live && onSelect(option)}
                disabled={!live}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/50",
                  !live && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{option.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Search term: {option.query}
                      {option.type !== "brand" ? ` · ${option.type}` : ""}
                    </p>
                    {option.sample_title && option.type === "topic" && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        e.g. {option.sample_title}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {option.platforms.slice(0, 4).map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {platformBadge(platform).icon} {platform}
                        </span>
                      ))}
                      {option.platforms.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{option.platforms.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {live ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Radio className="size-3" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No data</span>
                    )}
                    <p className="mt-1 text-xs font-semibold tabular-nums text-foreground">
                      {option.total_mentions.toLocaleString()} mentions
                    </p>
                    {selected && (
                      <CheckCircle2 className="ml-auto mt-1 size-4 text-primary" aria-hidden />
                    )}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function BrandWatchSearchField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brand, product, or keyword *"
        className={cn(inputSurface, "h-11 w-full pl-10")}
      />
    </div>
  )
}
