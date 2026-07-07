import type { AgeAnalysis, SearchResultItem, TopicRiskAssessment, UsageContextItem } from "@/lib/api/types"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const INTENSITY_COLORS: Record<string, { bg: string; color: string }> = {
  "High Positive": { bg: "#D1FAE5", color: "#065F46" },
  "Medium Positive": { bg: "#ECFDF5", color: "#16A34A" },
  "Low Positive": { bg: "#F0FDF4", color: "#4ADE80" },
  "High Negative": { bg: "#FEE2E2", color: "#7F1D1D" },
  "Medium Negative": { bg: "#FEF2F2", color: "#DC2626" },
  "Low Negative": { bg: "#FFF5F5", color: "#F87171" },
  "High Neutral": { bg: "#F3F4F6", color: "#374151" },
  "Medium Neutral": { bg: "#F9FAFB", color: "#6B7280" },
  "Low Neutral": { bg: "#FFFFFF", color: "#9CA3AF" },
}

const AGE_LABELS: Record<string, string> = {
  kids: "Kids",
  teens: "Teens",
  adults: "Adults",
  elderly: "Elderly",
}

const RISK_GAUGE_COLORS = {
  low: "#16A34A",
  mid: "#D97706",
  high: "#DC2626",
}

function gaugeColor(scorePct: number) {
  if (scorePct <= 33) return RISK_GAUGE_COLORS.low
  if (scorePct <= 66) return RISK_GAUGE_COLORS.mid
  return RISK_GAUGE_COLORS.high
}

function RiskMeter({ risk }: { risk: TopicRiskAssessment }) {
  const color = gaugeColor(risk.score_pct)
  const rotation = (risk.score_pct / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative h-24 w-48 overflow-hidden">
        <div
          className="absolute inset-0 rounded-t-full border-[10px] border-muted"
          style={{ borderBottomColor: "transparent" }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-1 w-1 origin-bottom"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            width: "80px",
            height: "4px",
            background: color,
            borderRadius: "2px",
          }}
        />
      </div>
      <p className="mt-2 text-lg font-semibold" style={{ color: `#${risk.color}` }}>
        {risk.label}
      </p>
      <p className="text-sm text-muted-foreground">
        Risk Score: {risk.score}/{risk.max_score}
      </p>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        {risk.description}
      </p>
    </div>
  )
}

function SentimentIntensityBar({ results }: { results: SearchResultItem[] }) {
  const buckets: Record<string, number> = {
    "Low Positive": 0,
    "Medium Positive": 0,
    "High Positive": 0,
    "Low Negative": 0,
    "Medium Negative": 0,
    "High Negative": 0,
  }

  for (const r of results) {
    const label = r.sentiment_detail?.label
    if (label && label in buckets) buckets[label] += 1
  }

  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1
  const segments = Object.entries(buckets).filter(([, count]) => count > 0)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Sentiment Intensity</p>
      <div className="flex h-3 overflow-hidden rounded-full">
        {segments.map(([label, count]) => {
          const style = INTENSITY_COLORS[label] ?? INTENSITY_COLORS["Low Neutral"]
          return (
            <div
              key={label}
              title={`${label}: ${count}`}
              style={{
                width: `${(count / total) * 100}%`,
                backgroundColor: style.bg,
                borderRight: "1px solid white",
              }}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map(([label, count]) => {
          const style = INTENSITY_COLORS[label] ?? INTENSITY_COLORS["Low Neutral"]
          return (
            <span
              key={label}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {label} ({count})
            </span>
          )
        })}
      </div>
    </div>
  )
}

function AgeGroupChart({ ageData }: { ageData: AgeAnalysis }) {
  const groups = ["kids", "teens", "adults", "elderly"] as const

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Age Group Distribution · {ageData.label}
      </p>
      <div className="space-y-2">
        {groups.map((group) => {
          const pct = ageData.distribution[group] ?? 0
          const isDominant = group === ageData.dominant_group
          return (
            <div
              key={group}
              className={cn(
                "rounded-lg border px-3 py-2",
                isDominant ? "border-purple-400 bg-purple-50/50" : "border-border"
              )}
            >
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium">{AGE_LABELS[group]}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", isDominant ? "bg-purple-500" : "bg-primary/60")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UsageTable({
  usageContext,
  dominantGroup,
}: {
  usageContext: UsageContextItem[]
  dominantGroup: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Daily Social Media Usage</p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Age Group</th>
              <th className="px-3 py-2 text-left font-medium">Daily Usage</th>
              <th className="px-3 py-2 text-left font-medium">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {usageContext.map((row) => {
              const isDominant = row.age_group === dominantGroup
              return (
                <tr
                  key={row.age_group}
                  className={cn(
                    "border-t border-border",
                    isDominant && "bg-purple-50/60"
                  )}
                >
                  <td className="px-3 py-2 font-medium capitalize">
                    {row.age_group}
                    {isDominant && (
                      <span className="ml-1 text-[10px] text-purple-600">(dominant)</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.avg_daily_hours} hrs/day</td>
                  <td className="px-3 py-2 capitalize">
                    {row.usage_risk}
                    {row.usage_risk === "high" && " ⚠️"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RiskFactorsList({ factors }: { factors: string[] }) {
  if (factors.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No significant risk factors detected.</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Risk Factors</p>
      <ul className="space-y-1">
        {factors.map((factor) => (
          <li
            key={factor}
            className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground"
          >
            → {factor}
          </li>
        ))}
      </ul>
    </div>
  )
}

type RiskAnalysisPanelProps = {
  riskData: TopicRiskAssessment
  ageData: AgeAnalysis
  usageContext: UsageContextItem[]
  results: SearchResultItem[]
  query: string
}

export function RiskAnalysisPanel({
  riskData,
  ageData,
  usageContext,
  results,
  query,
}: RiskAnalysisPanelProps) {
  return (
    <div className={cn(proCard, "p-6 sm:p-7")}>
      <h3 className={cn(sectionTitle, "text-lg")}>Content Risk Analysis</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Topic: &ldquo;{query}&rdquo;
      </p>

      <div className="mt-6 space-y-6">
        <RiskMeter risk={riskData} />
        <SentimentIntensityBar results={results} />
        <AgeGroupChart ageData={ageData} />
        <UsageTable usageContext={usageContext} dominantGroup={ageData.dominant_group} />
        <RiskFactorsList factors={riskData.risk_factors} />
      </div>
    </div>
  )
}

export { INTENSITY_COLORS }
