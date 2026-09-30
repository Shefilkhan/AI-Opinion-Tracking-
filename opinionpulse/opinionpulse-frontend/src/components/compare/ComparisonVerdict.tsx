import { Link } from "react-router-dom"
import { Copy, Printer, Scale, Sparkles } from "lucide-react"
import type { SearchResponse } from "@/lib/api/types"
import {
  buildCategoryLeaders,
  buildExecutiveSummary,
  buildPulseAiCompareUrl,
  comparisonConfidence,
  computeOverallEdge,
  type CategoryLeader,
} from "@/lib/compare-analytics"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ComparisonVerdictProps = {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
  onCopyLink?: () => void
}

function CategoryLeadersGrid({
  leaders,
  nameA,
  nameB,
}: {
  leaders: CategoryLeader[]
  nameA: string
  nameB: string
}) {
  if (!leaders.length) return null
  const countA = leaders.filter((l) => l.leader === "a").length
  const countB = leaders.filter((l) => l.leader === "b").length

  return (
    <div className="mt-5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
      <p className="compare-section-label mb-2">Category leaders</p>
      <p className="mb-3 text-xs text-[var(--dash-text-faint)]">
        {nameA} {countA} · {nameB} {countB} ·{" "}
        {Math.abs(countA - countB) <= 1 ? "Closely matched" : countA > countB ? `${nameA} leads` : `${nameB} leads`}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {leaders.map((l) => (
          <div
            key={l.category}
            className="flex items-center justify-between rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm"
          >
            <span className="text-[var(--dash-text-mid)]">{l.category}</span>
            <span
              className={cn(
                "font-semibold",
                l.leader === "a" ? "text-indigo-600" : "text-orange-600"
              )}
            >
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ComparisonVerdict({
  dataA,
  dataB,
  nameA,
  nameB,
  onCopyLink,
}: ComparisonVerdictProps) {
  const summary = buildExecutiveSummary(dataA, dataB, nameA, nameB)
  const confidence = comparisonConfidence(dataA, dataB)
  const edge = computeOverallEdge(dataA, dataB, nameA, nameB)
  const leaders = buildCategoryLeaders(dataA, dataB, nameA, nameB)

  return (
    <section className={cn(proCard, "border-l-4 border-l-[var(--dash-accent)] p-5 sm:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)]">
            <Scale className="size-5 text-[var(--dash-accent)]" />
          </div>
          <div>
            <p className="compare-section-label m-0">Comparison verdict</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--dash-text)]">{summary.headline}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 compare-no-print">
          <Link
            to={buildPulseAiCompareUrl(nameA, nameB, dataA, dataB)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-3 text-xs font-semibold hover:bg-[var(--dash-surface-elevated)]"
          >
            <Sparkles className="size-3.5 text-[var(--dash-accent)]" />
            Ask Pulse AI
          </Link>
          {onCopyLink && (
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-3 text-xs font-semibold hover:bg-[var(--dash-surface-elevated)]"
            >
              <Copy className="size-3.5" />
              Share
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-3 text-xs font-semibold hover:bg-[var(--dash-surface-elevated)]"
          >
            <Printer className="size-3.5" />
            Print
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {summary.bullets.map((b) => (
          <li key={b.slice(0, 40)} className="text-sm leading-relaxed text-[var(--dash-text-mid)]">
            {b}
          </li>
        ))}
      </ul>

      {edge && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="compare-section-label">{edge.labelA}</p>
            <p className="text-2xl font-bold text-indigo-600">{edge.scoreA} / 100</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="compare-section-label">{edge.labelB}</p>
            <p className="text-2xl font-bold text-orange-600">{edge.scoreB} / 100</p>
          </div>
          <p className="sm:col-span-2 text-[11px] text-[var(--dash-text-faint)]">{edge.explanation}</p>
        </div>
      )}

      <CategoryLeadersGrid leaders={leaders} nameA={nameA} nameB={nameB} />

      <div className="mt-4 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2.5 text-xs text-[var(--dash-text-mid)]">
        <strong>Comparison confidence: {confidence.level}</strong> — {confidence.explanation}
        {confidence.warning && (
          <p className="mt-1 text-amber-700 dark:text-amber-400">{confidence.warning}</p>
        )}
      </div>
    </section>
  )
}
