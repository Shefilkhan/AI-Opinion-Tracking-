import { Link } from "react-router-dom"
import { ArrowUpRight, Sparkles } from "lucide-react"
import type { CrisisNarrative } from "@/api/crisis"
import { platformDisplayName } from "@/lib/api/sentiment"
import { narrativeImpactLabel, spreadSeverityLabel } from "@/lib/crisis-display"
import { cn } from "@/lib/utils"

const IMPACT_STYLES = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  critical: "bg-red-500/10 text-red-700 dark:text-red-300",
}

type NarrativeCardsProps = {
  narratives: CrisisNarrative[]
  topicKeyword?: string
}

export function NarrativeCards({ narratives, topicKeyword }: NarrativeCardsProps) {
  if (narratives.length === 0) {
    return (
      <div className="crisis-empty-state">
        <p className="font-medium text-[var(--dash-text)]">No narrative clusters yet</p>
        <p className="mt-1 max-w-md text-sm text-[var(--dash-text-faint)]">
          Run <strong>Scan Now</strong> to group mentions into storylines — price concerns, product
          issues, regulation, etc.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {narratives.map((n) => (
        <article key={n.id} className="crisis-narrative-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="m-0 text-base font-semibold text-[var(--dash-text)]">{n.label}</h4>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                IMPACT_STYLES[n.severity] ?? IMPACT_STYLES.medium
              )}
            >
              {narrativeImpactLabel(n.severity)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--dash-text-mid)]">{n.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="crisis-stat-chip">{n.mention_count} mentions</span>
            <span className="crisis-stat-chip">{n.negative_pct}% negative</span>
            <span className="crisis-stat-chip">{spreadSeverityLabel(n.severity)}</span>
          </div>
          <p className="mt-2 text-xs text-[var(--dash-text-faint)]">
            Sources · {platformDisplayName(n.primary_platform)}
          </p>
          <blockquote className="mt-3 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2 text-xs italic text-[var(--dash-text-mid)]">
            “{n.example_snippet}”
          </blockquote>
          <div className="mt-3 flex flex-wrap gap-2">
            {topicKeyword && (
              <Link
                to={`/search?q=${encodeURIComponent(`${topicKeyword} ${n.label}`)}`}
                className="crisis-inline-action"
              >
                Inspect
                <ArrowUpRight className="size-3" />
              </Link>
            )}
            {n.example_url && (
              <a href={n.example_url} target="_blank" rel="noreferrer" className="crisis-inline-action">
                View source
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

export function NegativeDriversPanel({
  narratives,
  topicKeyword,
}: {
  narratives: CrisisNarrative[]
  topicKeyword: string
}) {
  const drivers = [...narratives]
    .filter((n) => n.negative_pct >= 40)
    .sort((a, b) => b.mention_count - a.mention_count)
    .slice(0, 5)

  if (drivers.length === 0) return null

  return (
    <section className="crisis-subsection">
      <h3 className="crisis-section-label m-0">Negative drivers</h3>
      <ul className="mt-3 space-y-2">
        {drivers.map((n) => (
          <li key={n.id}>
            <Link
              to={`/search?q=${encodeURIComponent(`${topicKeyword} ${n.label}`)}`}
              className="crisis-driver-row"
            >
              <div>
                <p className="font-medium text-[var(--dash-text)]">{n.label}</p>
                <p className="text-xs text-[var(--dash-text-faint)]">
                  {n.mention_count} mentions · {n.negative_pct}% negative
                </p>
              </div>
              <Sparkles className="size-4 text-[var(--dash-text-faint)]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
