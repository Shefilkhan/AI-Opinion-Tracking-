import { Link } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"
import type { CrisisQuadrant } from "@/api/crisis"
import { buildPulseAiUrl, quadrantDisplayLabel } from "@/lib/crisis-display"
import { btnPrimary, proCard } from "@/lib/ui-classes"

type RecommendedActionProps = {
  keyword: string
  quadrant: CrisisQuadrant
}

export function RecommendedAction({ keyword, quadrant }: RecommendedActionProps) {
  const status = quadrantDisplayLabel(quadrant)

  let title = "No action required."
  let body = "Continue monitoring automatically."
  let primary: { label: string; href: string } | null = null
  let secondary: { label: string; href: string } | null = null

  switch (quadrant) {
    case "crisis":
      title = "Review highest-impact negative signals immediately."
      body = "Crisis-level volume and negative acceleration detected."
      primary = { label: "Open Search", href: `/search?q=${encodeURIComponent(keyword)}` }
      secondary = { label: "Ask Pulse AI", href: buildPulseAiUrl(keyword, quadrant) }
      break
    case "watch":
      title = "Investigate negative themes and high-impact mentions."
      body = "Negative conversation is accelerating faster than baseline."
      primary = { label: "Investigate", href: `/search?q=${encodeURIComponent(keyword)}` }
      secondary = { label: "Ask Pulse AI", href: buildPulseAiUrl(keyword, quadrant) }
      break
    case "noise":
      title = "Review the main conversation drivers."
      body = "No crisis response is currently necessary."
      primary = { label: "Open Search", href: `/search?q=${encodeURIComponent(keyword)}` }
      break
    default:
      break
  }

  return (
    <section className={`${proCard} p-5 sm:p-6`}>
      <h3 className="crisis-section-label m-0">Recommended action</h3>
      <p className="mt-2 text-sm font-medium text-[var(--dash-text)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--dash-text-mid)]">{body}</p>
      {quadrant !== "quiet" && (
        <p className="mt-1 text-xs text-[var(--dash-text-faint)]">Status: {status}</p>
      )}
      {(primary || secondary) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {primary && (
            <Link to={primary.href} className={btnPrimary}>
              {primary.label}
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          )}
          {secondary && (
            <Link
              to={secondary.href}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--dash-surface-elevated)]"
            >
              <Sparkles className="size-4 text-[var(--dash-accent)]" />
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
