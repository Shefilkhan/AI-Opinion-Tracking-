import { cn } from "@/lib/utils"

type SentimentSplitBarProps = {
  positive: number
  negative: number
  neutral?: number
  className?: string
  showLegend?: boolean
}

export function SentimentSplitBar({
  positive,
  negative,
  neutral,
  className,
  showLegend = true,
}: SentimentSplitBarProps) {
  const neu = neutral ?? Math.max(0, 100 - positive - negative)

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--dash-surface-alt)]">
        {positive > 0 && (
          <div
            className="bg-[var(--dash-pos)] transition-[width] duration-300"
            style={{ width: `${positive}%` }}
            title={`Positive ${positive}%`}
          />
        )}
        {neu > 0 && (
          <div
            className="bg-[var(--dash-neu)] transition-[width] duration-300"
            style={{ width: `${neu}%` }}
            title={`Neutral ${neu}%`}
          />
        )}
        {negative > 0 && (
          <div
            className="bg-[var(--dash-neg)] transition-[width] duration-300"
            style={{ width: `${negative}%` }}
            title={`Negative ${negative}%`}
          />
        )}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--dash-text-faint)]">
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[var(--dash-pos)]" />
            {positive}% pos
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[var(--dash-neu)]" />
            {neu}% neu
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[var(--dash-neg)]" />
            {negative}% neg
          </span>
        </div>
      )}
    </div>
  )
}
