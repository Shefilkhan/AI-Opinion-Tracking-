import {
  Activity,
  BarChart3,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Link } from "react-router-dom"
import type { RadarPoint } from "@/api/crisis"
import { CrisisStatusBadge } from "@/components/crisis/CrisisStatusBadge"
import {
  buildPulseAiUrl,
  computeRiskScore,
  formatMentionsDelta,
  formatNegativeDelta,
  formatVolumeDelta,
  hasInsufficientBaseline,
  quadrantSeverityClass,
  riskLevelExplanation,
  riskLevelLabel,
} from "@/lib/crisis-display"
import { Button } from "@/components/ui/button"
import { btnPrimary, proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SelectedWatchPanelProps = {
  point: RadarPoint
  scanning: boolean
  onScan: () => void
}

export function SelectedWatchPanel({ point, scanning, onScan }: SelectedWatchPanelProps) {
  const riskScore = computeRiskScore(point)
  const insufficient = hasInsufficientBaseline(point)

  const kpis = [
    {
      label: "Volume",
      value: `${Math.round(point.volume_score)} / 100`,
      delta: formatVolumeDelta(point),
      icon: BarChart3,
    },
    {
      label: "Negative velocity",
      value: `${Math.round(point.velocity_score)} / 100`,
      delta: point.velocity_score >= 50 ? "↑ Elevated" : "Within range",
      icon: TrendingUp,
    },
    {
      label: "Mentions",
      value: String(point.mention_count_30m),
      delta: formatMentionsDelta(point),
      icon: Activity,
    },
    {
      label: "Negative share",
      value: `${point.negative_pct_30m}%`,
      delta: formatNegativeDelta(point),
      icon: MessageSquareWarning,
    },
  ]

  return (
    <section className={cn(proCard, "crisis-selected-panel overflow-hidden", quadrantSeverityClass(point.quadrant))}>
      <div className="border-b border-[var(--dash-border)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="crisis-section-label m-0">Selected topic</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-2xl font-semibold tracking-tight text-[var(--dash-text)]">
                {point.keyword}
              </h2>
              <CrisisStatusBadge quadrant={point.quadrant} size="lg" />
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--dash-text-mid)]">
              {point.status_explanation}
            </p>
          </div>

          <div className="crisis-risk-score shrink-0 text-right">
            <p className="crisis-mini-label m-0">Risk score</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--dash-text)]">
              {insufficient ? "—" : riskScore}
              {!insufficient && (
                <span className="text-base font-medium text-[var(--dash-text-faint)]"> / 100</span>
              )}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--dash-text-mid)]">
              {riskLevelLabel(point.quadrant)}
            </p>
            <p className="mt-1 max-w-[12rem] text-[11px] leading-snug text-[var(--dash-text-faint)]">
              {insufficient
                ? "Baseline building — scores stabilize after more scans."
                : riskLevelExplanation(point.quadrant)}
            </p>
          </div>
        </div>

        {insufficient && (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 text-sm text-[var(--dash-text-mid)]">
            Not enough historical data yet. Crisis Radar needs additional scans to build a reliable
            baseline.
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="crisis-kpi-card">
              <div className="mb-2 flex items-center gap-1.5">
                <kpi.icon className="size-3.5 text-[var(--dash-text-faint)]" />
                <span className="crisis-mini-label">{kpi.label}</span>
              </div>
              <p className="crisis-kpi-value">{kpi.value}</p>
              {kpi.delta && (
                <p className="mt-1 text-[11px] text-[var(--dash-text-faint)]">{kpi.delta}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button className={btnPrimary} disabled={scanning} onClick={onScan}>
            {scanning ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Scan Now
          </Button>
          <Link
            to={`/search?q=${encodeURIComponent(point.keyword)}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--dash-surface-elevated)]"
          >
            <Search className="size-4" />
            Open Search
          </Link>
          <Link
            to={buildPulseAiUrl(point.keyword, point.quadrant)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--dash-surface-elevated)]"
          >
            <Sparkles className="size-4 text-[var(--dash-accent)]" />
            Ask Pulse AI
          </Link>
        </div>

        {scanning && (
          <p className="mt-3 text-xs text-[var(--dash-text-faint)]">Scanning live sources…</p>
        )}
      </div>
    </section>
  )
}
