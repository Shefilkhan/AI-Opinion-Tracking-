import { ArrowLeftRight, Loader2, X } from "lucide-react"
import { getRecentSearches } from "@/lib/recentSearchStorage"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CompareControlsProps = {
  queryA: string
  queryB: string
  loading: boolean
  onChangeA: (v: string) => void
  onChangeB: (v: string) => void
  onSwap: () => void
  onClear: () => void
  onSubmit: () => void
  compact?: boolean
}

export function CompareControls({
  queryA,
  queryB,
  loading,
  onChangeA,
  onChangeB,
  onSwap,
  onClear,
  onSubmit,
  compact = false,
}: CompareControlsProps) {
  const recent = getRecentSearches().slice(0, 6)
  const canCompare = queryA.trim().length >= 2 && queryB.trim().length >= 2

  return (
    <div className={compact ? "" : "space-y-4"}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="flex flex-col items-stretch gap-3 md:flex-row md:items-center"
      >
        <input
          type="text"
          value={queryA}
          onChange={(e) => onChangeA(e.target.value)}
          placeholder="Topic A (e.g., React)"
          aria-label="Topic A"
          className={cn(inputSurface, "compare-input-a h-12 flex-1 rounded-xl px-4 text-sm")}
        />
        <button
          type="button"
          onClick={onSwap}
          className="compare-swap-btn compare-no-print mx-auto shrink-0"
          aria-label="Swap topics"
          title="Swap topics"
        >
          <ArrowLeftRight className="size-4" />
        </button>
        <input
          type="text"
          value={queryB}
          onChange={(e) => onChangeB(e.target.value)}
          placeholder="Topic B (e.g., Angular)"
          aria-label="Topic B"
          className={cn(inputSurface, "compare-input-b h-12 flex-1 rounded-xl px-4 text-sm")}
        />
        <div className="flex gap-2 shrink-0">
          <Button
            type="submit"
            disabled={loading || !canCompare}
            className={cn("h-12 rounded-xl px-6", btnPrimary)}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : "Compare"}
          </Button>
          {(queryA || queryB) && (
            <Button
              type="button"
              variant="outline"
              className="compare-no-print h-12 rounded-xl"
              onClick={onClear}
              aria-label="Clear"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </form>

      {!compact && recent.length > 0 && (
        <div className="compare-no-print flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--dash-text-faint)]">Recent:</span>
          {recent.map((q) => (
            <button
              key={q}
              type="button"
              className="compare-theme-chip"
              onClick={() => {
                if (!queryA.trim()) onChangeA(q)
                else if (!queryB.trim()) onChangeB(q)
                else onChangeA(q)
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
