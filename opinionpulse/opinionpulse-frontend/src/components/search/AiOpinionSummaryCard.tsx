import { RefreshCw, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { AiOpinionSummary } from "@/api/ai"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type AiOpinionSummaryCardProps = {
  summary: AiOpinionSummary | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

function trendIcon(trend: string) {
  if (trend === "rising") return <TrendingUp className="size-3.5 text-success" />
  if (trend === "falling") return <TrendingDown className="size-3.5 text-destructive" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function LabeledRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string | number
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="text-right text-sm font-medium text-foreground">
        {children ?? value}
      </div>
    </div>
  )
}

export function AiOpinionSummaryCard({
  summary,
  loading,
  error,
  onRetry,
}: AiOpinionSummaryCardProps) {
  if (loading) {
    return (
      <div className={cn(proCard, "border-l-4 border-l-primary p-6")}>
        <p className="animate-pulse text-sm font-medium text-primary">
          AI is analyzing public opinion…
        </p>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(proCard, "p-6 text-center")}>
        <p className="text-sm text-muted-foreground">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        )}
      </div>
    )
  }

  if (!summary) return null

  const score = Math.min(100, Math.max(0, summary.sentiment_score ?? 0))

  return (
    <div className={cn(proCard, "border-l-4 border-l-primary p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={sectionTitle}>AI Opinion Analysis</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Sparkles className="size-3" />
          Structured AI output
        </span>
      </div>

      <div className="mt-4">
        <LabeledRow label="Verdict" value={summary.verdict} />
        <LabeledRow label="Sentiment">
          <div className="flex min-w-[120px] flex-col items-end gap-1">
            <span>{score}/100</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </LabeledRow>
        <LabeledRow label="Positive Driver" value={summary.top_positive_driver} />
        <LabeledRow label="Negative Driver" value={summary.top_negative_driver} />
        <LabeledRow label="Top Angle" value={summary.most_discussed_angle} />
        <LabeledRow label="Trend">
          <span className="inline-flex items-center gap-1 capitalize">
            {trendIcon(summary.trend)}
            {summary.trend} {summary.trend === "rising" ? "↑" : summary.trend === "falling" ? "↓" : ""}
          </span>
        </LabeledRow>
        <LabeledRow label="Confidence">
          <span className="capitalize">{summary.confidence}</span>
        </LabeledRow>
      </div>
    </div>
  )
}
