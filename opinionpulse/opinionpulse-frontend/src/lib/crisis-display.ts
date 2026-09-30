import type { CrisisEvent, CrisisQuadrant, RadarPoint } from "@/api/crisis"

/** Backend quadrant enum — display labels only (no API migration). */
export const QUADRANT_DISPLAY: Record<
  CrisisQuadrant,
  { label: string; short: string; description: string }
> = {
  quiet: {
    label: "Normal",
    short: "Normal",
    description: "Low or typical activity; no intervention needed.",
  },
  noise: {
    label: "High Activity",
    short: "High Activity",
    description: "Conversation volume is elevated, but negativity is not accelerating rapidly.",
  },
  watch: {
    label: "Watch",
    short: "Watch",
    description: "Negative conversation is accelerating; monitor closely.",
  },
  crisis: {
    label: "Crisis",
    short: "Crisis",
    description: "High conversation volume combined with rapid negative acceleration.",
  },
}

export const VOLUME_THRESHOLD = 50
export const VELOCITY_THRESHOLD = 50

export function quadrantDisplayLabel(quadrant: CrisisQuadrant): string {
  return QUADRANT_DISPLAY[quadrant].label
}

export function quadrantSeverityClass(quadrant: CrisisQuadrant): string {
  switch (quadrant) {
    case "crisis":
      return "crisis-severity-crisis"
    case "watch":
      return "crisis-severity-watch"
    case "noise":
      return "crisis-severity-high-activity"
    default:
      return "crisis-severity-normal"
  }
}

/** Transparent composite from existing volume + velocity scores (0–100 each). */
export function computeRiskScore(point: Pick<RadarPoint, "volume_score" | "velocity_score">): number {
  return Math.round((point.volume_score + point.velocity_score) / 2)
}

export function riskLevelLabel(quadrant: CrisisQuadrant): string {
  switch (quadrant) {
    case "crisis":
      return "Critical"
    case "watch":
      return "Elevated"
    case "noise":
      return "Elevated"
    default:
      return "Normal"
  }
}

export function riskLevelExplanation(quadrant: CrisisQuadrant): string {
  switch (quadrant) {
    case "crisis":
      return "High volume with rapid negative acceleration — review immediately."
    case "watch":
      return "Negative sentiment is accelerating faster than usual."
    case "noise":
      return "Elevated conversation, no crisis-level negative acceleration."
    default:
      return "Activity is within normal monitoring ranges."
  }
}

export function countElevated(points: RadarPoint[]): number {
  return points.filter((p) => p.quadrant === "watch" || p.quadrant === "noise").length
}

export function countCrisis(points: RadarPoint[]): number {
  return points.filter((p) => p.quadrant === "crisis").length
}

export function attentionPoint(points: RadarPoint[]): RadarPoint | null {
  const order: CrisisQuadrant[] = ["crisis", "watch", "noise", "quiet"]
  for (const q of order) {
    const match = points.find((p) => p.quadrant === q)
    if (match && q !== "quiet") return match
  }
  return null
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Not scanned yet"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "Unknown"
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec} sec ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`
  return new Date(iso).toLocaleDateString()
}

export function formatVolumeDelta(point: RadarPoint): string | null {
  const baseline = point.baseline_mentions_30m ?? 0
  if (!baseline || !point.volume_spike_multiplier) return null
  const pct = Math.round((point.volume_spike_multiplier - 1) * 100)
  if (pct === 0) return "At baseline"
  return `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% vs baseline`
}

export function formatMentionsDelta(point: RadarPoint): string | null {
  const baseline = point.baseline_mentions_30m ?? 0
  if (!baseline) return null
  const pct = Math.round(((point.mention_count_30m - baseline) / baseline) * 100)
  if (pct === 0) return "At normal"
  return `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% vs normal`
}

export function formatNegativeDelta(point: RadarPoint): string | null {
  const baseline = point.baseline_negative_30m ?? 0
  if (!baseline) return null
  const currentRate = point.negative_pct_30m
  const typicalRate =
    point.mention_count_30m > 0
      ? Math.round((baseline / Math.max(point.baseline_mentions_30m || baseline, 1)) * 100)
      : 0
  const pp = currentRate - typicalRate
  if (Math.abs(pp) < 1) return "Near baseline"
  return `${pp > 0 ? "+" : ""}${pp} pp vs baseline`
}

export type StatusCheckItem = {
  ok: boolean
  title: string
  detail: string
}

export function buildWhyThisStatus(point: RadarPoint): {
  checks: StatusCheckItem[]
  conclusion: string
} {
  const highVol = point.volume_score >= VOLUME_THRESHOLD
  const highVel = point.velocity_score >= VELOCITY_THRESHOLD
  const checks: StatusCheckItem[] = [
    {
      ok: highVol,
      title: highVol
        ? "Conversation volume crossed the elevated threshold."
        : "Conversation volume is below the elevated threshold.",
      detail: `Current volume score: ${Math.round(point.volume_score)}`,
    },
    {
      ok: highVel,
      title: highVel
        ? "Negative velocity crossed the watch threshold."
        : "Negative velocity remains below the watch threshold.",
      detail: `Current velocity score: ${Math.round(point.velocity_score)}`,
    },
    {
      ok: point.negative_pct_30m <= 35 || !highVel,
      title:
        point.negative_pct_30m > 35
          ? "Negative share is elevated in recent mentions."
          : "Negative share is near historical baseline.",
      detail: `Current: ${point.negative_pct_30m}%${
        point.baseline_negative_30m
          ? ` · Typical neg count: ${point.baseline_negative_30m}/30m`
          : ""
      }`,
    },
  ]

  return {
    checks,
    conclusion: point.status_explanation || QUADRANT_DISPLAY[point.quadrant].description,
  }
}

export function buildWhatChanged(point: RadarPoint): Array<{
  label: string
  from: string
  to: string
  delta: string
}> {
  const baselineMentions = Math.round(point.baseline_mentions_30m ?? 0)
  const items: Array<{ label: string; from: string; to: string; delta: string }> = []

  if (baselineMentions > 0) {
    items.push({
      label: "Mentions",
      from: String(baselineMentions),
      to: String(point.mention_count_30m),
      delta: formatMentionsDelta(point) ?? "—",
    })
  }

  items.push({
    label: "Volume score",
    from: "—",
    to: String(Math.round(point.volume_score)),
    delta: formatVolumeDelta(point) ?? "—",
  })

  items.push({
    label: "Negative share",
    from: point.baseline_negative_30m ? `${point.baseline_negative_30m} neg / 30m` : "—",
    to: `${point.negative_pct_30m}%`,
    delta: formatNegativeDelta(point) ?? "—",
  })

  items.push({
    label: "Velocity score",
    from: "—",
    to: String(Math.round(point.velocity_score)),
    delta: point.velocity_score >= VELOCITY_THRESHOLD ? "↑ Elevated" : "Within range",
  })

  return items
}

export function narrativeImpactLabel(severity: string): string {
  switch (severity) {
    case "critical":
      return "Critical Impact"
    case "high":
      return "High Impact"
    case "medium":
      return "Medium Impact"
    default:
      return "Low Impact"
  }
}

export function spreadSeverityLabel(severity: string): string {
  switch (severity) {
    case "critical":
      return "High Spread"
    case "high":
      return "High Spread"
    case "medium":
      return "Medium Spread"
    default:
      return "Low Spread"
  }
}

export function buildPulseAiPrompt(topic: string, quadrant: CrisisQuadrant): string {
  const status = quadrantDisplayLabel(quadrant)
  return `Why is ${topic} in ${status} on Crisis Radar? What should I investigate first?`
}

export function buildPulseAiUrl(topic: string, quadrant: CrisisQuadrant): string {
  return `/chat?prompt=${encodeURIComponent(buildPulseAiPrompt(topic, quadrant))}`
}

export function eventsToSignalHistory(events: CrisisEvent[]): Array<{
  time: string
  mentions: number
  negativePct: number
  volumeScore: number
  velocityScore: number
  status: string
  quadrant: CrisisQuadrant
}> {
  return [...events]
    .reverse()
    .map((e) => ({
      time: new Date(e.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      mentions: 0,
      negativePct: 0,
      volumeScore: e.volume_score,
      velocityScore: e.velocity_score,
      status: e.status_label || quadrantDisplayLabel(e.quadrant),
      quadrant: e.quadrant,
    }))
}

export function hasInsufficientBaseline(point: RadarPoint): boolean {
  return !point.last_scanned_at || (point.baseline_mentions_30m ?? 0) === 0
}
