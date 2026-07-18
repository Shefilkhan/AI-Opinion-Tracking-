import { useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import type { DashboardOverview } from "@/api/dashboard"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type SentimentDonutChartProps = {
  stats: DashboardOverview["stats"]
}

type Segment = {
  name: string
  value: number
  color: string
}

const SENTIMENT_DESCRIPTIONS: Record<string, string> = {
  Positive: "Share of positive sentiment across tracked sources",
  Neutral: "Share of neutral sentiment across tracked sources",
  Negative: "Share of negative sentiment across tracked sources",
}

function parsePercent(value: string): number {
  const n = parseInt(value.replace(/[^\d]/g, ""), 10)
  return Number.isFinite(n) ? n : 0
}

export function SentimentDonutChart({ stats }: SentimentDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const positive = stats.positive_sentiment.progress ?? parsePercent(stats.positive_sentiment.value)
  const negative = stats.negative_sentiment.progress ?? parsePercent(stats.negative_sentiment.value)
  const neutral = Math.max(0, 100 - positive - negative)

  const data: Segment[] = [
    { name: "Positive", value: positive, color: "var(--dash-chart-pink)" },
    { name: "Neutral", value: neutral, color: "var(--dash-chart-yellow)" },
    { name: "Negative", value: negative, color: "var(--dash-chart-blue)" },
  ].filter((d) => d.value > 0)

  const hovered = activeIndex != null ? data[activeIndex] : null

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 font-serif-display text-lg font-semibold text-[var(--dash-text)]">
        Sentiment statistics
      </h2>

      <div className={cn(dashCardStatic, "flex flex-1 flex-col items-center justify-center p-4 sm:p-5")}>
        <div className="relative h-[200px] w-full max-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    className="cursor-pointer transition-opacity"
                    opacity={activeIndex == null || activeIndex === index ? 1 : 0.45}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {hovered ? (
              <>
                <span className="text-xl font-semibold text-[var(--dash-text)]">{hovered.value}%</span>
                <span className="text-xs text-[var(--dash-text-faint)]">{hovered.name.toLowerCase()}</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-[var(--dash-text)]">{positive}%</span>
                <span className="text-xs text-[var(--dash-text-faint)]">positive</span>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            "mt-3 w-full rounded-xl border px-3 py-2.5 text-xs transition-colors",
            hovered
              ? "border-[var(--dash-border)] bg-[var(--dash-surface-alt)]"
              : "border-transparent bg-transparent"
          )}
        >
          {hovered ? (
            <div className="space-y-1">
              <p className="font-semibold text-[var(--dash-text)]">{hovered.name} sentiment</p>
              <p className="text-sm font-medium" style={{ color: hovered.color }}>
                {hovered.value}% of overall sentiment
              </p>
              <p className="leading-relaxed text-[var(--dash-text-faint)]">
                {SENTIMENT_DESCRIPTIONS[hovered.name]}
              </p>
            </div>
          ) : (
            <p className="text-center text-[var(--dash-text-faint)]">
              Hover a chart segment to see percentage and details
            </p>
          )}
        </div>

        <div className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          {data.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                activeIndex === index
                  ? "bg-[var(--dash-surface-alt)] ring-1 ring-[var(--dash-border)]"
                  : "hover:bg-[var(--dash-surface-alt)]"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(undefined)}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="text-[var(--dash-text-mid)]">{item.name}</span>
              <span className="ml-auto font-semibold text-[var(--dash-text)]">{item.value}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
