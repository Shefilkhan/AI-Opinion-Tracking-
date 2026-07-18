/**
 * RiskProfileCard
 *
 * Renders structured risk-analysis results. Replaces the old prose paragraph
 * with:
 *   - Pill badges for content_type, sentiment, sentiment_intensity, age_group
 *   - A colour-coded risk level gauge
 *   - A numeric composite score bar (0–3 scale)
 *   - Bullet chips for contributing factors
 *   - Hours badge
 */

import { AlertTriangle, CheckCircle, Clock, Info, ShieldAlert } from "lucide-react"
import type { RiskProfile } from "@/lib/api/types"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low: {
    label: "Low Risk",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
    pct: 15,
  },
  mild: {
    label: "Mild Risk",
    bar: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: Info,
    pct: 38,
  },
  average: {
    label: "Average Risk",
    bar: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: AlertTriangle,
    pct: 62,
  },
  high: {
    label: "High Risk",
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: ShieldAlert,
    pct: 92,
  },
} as const

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  neutral: "bg-muted text-muted-foreground border-border",
  negative: "bg-red-500/10 text-red-400 border-red-500/25",
}

const INTENSITY_BADGE: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  high: "bg-red-500/10 text-red-400 border-red-500/25",
}

const AGE_BADGE: Record<string, string> = {
  kids: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  teen: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  adult: "bg-muted text-muted-foreground border-border",
}

function Pill({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        className
      )}
    >
      {label}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function RiskProfileCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 w-16 rounded-full bg-muted" />
        ))}
      </div>
      <div className="h-3 rounded bg-muted" />
      <div className="h-8 w-24 rounded bg-muted" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type RiskProfileCardProps = {
  profile: RiskProfile
  className?: string
}

export function RiskProfileCard({ profile, className }: RiskProfileCardProps) {
  const risk = RISK_CONFIG[profile.risk_level] ?? RISK_CONFIG.average
  const RiskIcon = risk.icon

  // Composite score → progress bar percentage (score is 0–3)
  const scorePct = Math.round((profile.composite_score / 3) * 100)

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="size-4 text-primary" aria-hidden />
          Risk Analysis
        </h3>
        {!profile.ai_enabled && (
          <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
            AI offline · defaults used
          </span>
        )}
      </div>

      {/* Signal pills */}
      <div className="flex flex-wrap gap-2">
        <Pill
          label={profile.content_type}
          className="bg-primary/10 text-primary border-primary/25"
        />
        <Pill
          label={profile.sentiment}
          className={SENTIMENT_BADGE[profile.sentiment] ?? "bg-muted text-muted-foreground border-border"}
        />
        <Pill
          label={`${profile.sentiment_intensity} intensity`}
          className={INTENSITY_BADGE[profile.sentiment_intensity] ?? "bg-muted text-muted-foreground border-border"}
        />
        <Pill
          label={profile.age_group}
          className={AGE_BADGE[profile.age_group] ?? "bg-muted text-muted-foreground border-border"}
        />
      </div>

      {/* Risk level + composite score */}
      <div className="space-y-2">
        {/* Risk badge */}
        <div className="flex items-center gap-2">
          <RiskIcon
            className={cn(
              "size-4 shrink-0",
              risk.label.includes("High")
                ? "text-red-400"
                : risk.label.includes("Average")
                  ? "text-orange-400"
                  : risk.label.includes("Mild")
                    ? "text-yellow-400"
                    : "text-emerald-400"
            )}
            aria-hidden
          />
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
              risk.badge
            )}
          >
            {risk.label}
          </span>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {profile.composite_score.toFixed(2)} / 3.00
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={scorePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Risk score: ${profile.composite_score.toFixed(2)} out of 3`}
        >
          <div
            className={cn("h-full rounded-full transition-all duration-500", risk.bar)}
            style={{ width: `${scorePct}%` }}
          />
        </div>

        {/* Threshold legend */}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Low</span>
          <span>Mild</span>
          <span>Average</span>
          <span>High</span>
        </div>
      </div>

      {/* Risk rationale */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">
          {profile.risk_rationale.primary_reason}
        </p>
        {profile.risk_rationale.contributing_factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.risk_rationale.contributing_factors.map((factor, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                · {factor}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hours badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
        <Clock className="size-3" aria-hidden />
        <span>
          <strong className="text-foreground font-medium">
            {profile.social_media_usage_hours.toFixed(1)} h / day
          </strong>{" "}
          on social media (used in scoring)
        </span>
      </div>
    </div>
  )
}
