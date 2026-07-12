import { Sparkles } from "lucide-react"
import type { CrisisNarrative } from "@/api/crisis"
import { platformDisplayName } from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

const SEVERITY_STYLES = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
}

type NarrativeCardsProps = {
  narratives: CrisisNarrative[]
}

export function NarrativeCards({ narratives }: NarrativeCardsProps) {
  if (narratives.length === 0) {
    return (
      <div className="crisis-empty-state">
        <div className="crisis-empty-icon">
          <Sparkles className="size-5" />
        </div>
        <p className="font-medium text-[var(--dash-text)]">No narratives yet</p>
        <p className="mt-1 max-w-xs text-sm text-[var(--dash-text-faint)]">
          Click <strong>Scan now</strong> above. When mentions spike, AI groups them into
          storylines — outage, CEO tweet, security leak, etc.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {narratives.map((n) => (
        <article
          key={n.id}
          className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4 transition-shadow hover:shadow-sm"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--dash-text)]">{n.label}</h4>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                SEVERITY_STYLES[n.severity] ?? SEVERITY_STYLES.medium
              )}
            >
              {n.severity}
            </span>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-[var(--dash-text-mid)]">{n.summary}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="crisis-stat-chip">{n.mention_count} mentions</span>
            <span className="crisis-stat-chip">{n.negative_pct}% negative</span>
            <span className="crisis-stat-chip">{platformDisplayName(n.primary_platform)}</span>
          </div>
          <blockquote className="rounded-lg bg-[var(--dash-bg)] px-3 py-2 text-xs italic text-[var(--dash-text-mid)]">
            “{n.example_snippet}”
          </blockquote>
          {n.example_url && (
            <a
              href={n.example_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-medium text-[var(--dash-accent)] hover:underline"
            >
              View source →
            </a>
          )}
        </article>
      ))}
    </div>
  )
}
