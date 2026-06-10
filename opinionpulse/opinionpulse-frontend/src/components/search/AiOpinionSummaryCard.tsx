import { Check, Lightbulb, RefreshCw, Sparkles, X } from "lucide-react"
import type { AiOpinionSummary } from "@/api/ai"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type AiOpinionSummaryCardProps = {
  summary: AiOpinionSummary | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

function verdictBadge(verdict: string) {
  const v = verdict.toLowerCase()
  if (v.includes("positive")) {
    return { label: "OVERALL POSITIVE", className: "bg-green-100 text-green-800" }
  }
  if (v.includes("negative")) {
    return { label: "OVERALL NEGATIVE", className: "bg-red-100 text-red-800" }
  }
  if (v.includes("divided")) {
    return { label: "DEEPLY DIVIDED", className: "bg-orange-100 text-orange-800" }
  }
  return { label: "MOSTLY NEUTRAL", className: "bg-muted text-muted-foreground" }
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
          🤖 AI is analyzing public opinion…
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted/80" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted/80" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(proCard, "p-6 text-center")}>
        <p className="text-sm text-muted-foreground">🤖 {error}</p>
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

  const badge = verdictBadge(summary.verdict)

  return (
    <div className={cn(proCard, "border-l-4 border-l-primary p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={sectionTitle}>
          🤖 AI Opinion Analysis
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
          <Sparkles className="size-3" />
          Powered by Claude
        </span>
      </div>

      <p className="mt-4 text-lg font-bold leading-snug text-foreground">
        &ldquo;{summary.headline}&rdquo;
      </p>

      <span
        className={cn(
          "mt-3 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          badge.className
        )}
      >
        {badge.label}
      </span>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{summary.overview}</p>

      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex gap-2 text-green-800">
          <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
          <span>
            <strong>Why positive:</strong> {summary.why_positive}
          </span>
        </li>
        <li className="flex gap-2 text-red-800">
          <X className="mt-0.5 size-4 shrink-0 text-red-600" />
          <span>
            <strong>Why negative:</strong> {summary.why_negative}
          </span>
        </li>
        <li className="flex gap-2 text-amber-900">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span>
            <strong>Key insight:</strong> {summary.key_insight}
          </span>
        </li>
      </ul>

      <p className="mt-4 border-t border-border pt-4 text-sm italic text-muted-foreground">
        &ldquo;{summary.one_liner}&rdquo;
      </p>
    </div>
  )
}
