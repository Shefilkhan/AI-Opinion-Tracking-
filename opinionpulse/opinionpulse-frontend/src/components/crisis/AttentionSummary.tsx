import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import type { RadarPoint } from "@/api/crisis"
import { CrisisStatusBadge } from "@/components/crisis/CrisisStatusBadge"
import {
  attentionPoint,
  buildPulseAiUrl,
  quadrantSeverityClass,
} from "@/lib/crisis-display"
import { cn } from "@/lib/utils"
import { btnPrimary, proCard } from "@/lib/ui-classes"

type AttentionSummaryProps = {
  points: RadarPoint[]
  onSelect: (watchId: string) => void
}

export function AttentionSummary({ points, onSelect }: AttentionSummaryProps) {
  const focus = attentionPoint(points)

  if (!focus) {
    return (
      <div className={cn(proCard, "crisis-attention crisis-attention-ok p-5 sm:p-6")}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <p className="m-0 text-sm font-semibold text-[var(--dash-text)]">
              All monitored topics are within normal ranges.
            </p>
            <p className="mt-1 mb-0 text-sm text-[var(--dash-text-mid)]">
              Crisis Radar will surface the first topic that needs attention.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        proCard,
        "crisis-attention p-5 sm:p-6",
        quadrantSeverityClass(focus.quadrant)
      )}
    >
      <p className="crisis-section-label m-0">Needs attention</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-xl font-semibold text-[var(--dash-text)]">
              {focus.name || focus.keyword}
            </h2>
            <CrisisStatusBadge quadrant={focus.quadrant} size="sm" />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--dash-text-mid)]">
            {focus.status_explanation}
          </p>
          <p className="mt-2 text-xs text-[var(--dash-text-faint)]">
            {focus.mention_count_30m} mentions in the last 30 minutes · {focus.negative_pct_30m}%
            negative
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => onSelect(focus.watch_id)}
          >
            Investigate
            <ArrowRight className="ml-1.5 size-4" />
          </button>
          <Link
            to={buildPulseAiUrl(focus.keyword, focus.quadrant)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--dash-surface-elevated)]"
          >
            <Sparkles className="size-4 text-[var(--dash-accent)]" />
            Ask Pulse AI
          </Link>
        </div>
      </div>
    </div>
  )
}
