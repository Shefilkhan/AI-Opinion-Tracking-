import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import type { DashboardOverview } from "@/api/dashboard"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type SentimentDonutChartProps = {
  stats: DashboardOverview["stats"]
}

function parsePercent(value: string): number {
  const n = parseInt(value.replace(/[^\d]/g, ""), 10)
  return Number.isFinite(n) ? n : 0
}

export function SentimentDonutChart({ stats }: SentimentDonutChartProps) {
  const positive = stats.positive_sentiment.progress ?? parsePercent(stats.positive_sentiment.value)
  const negative = stats.negative_sentiment.progress ?? parsePercent(stats.negative_sentiment.value)
  const neutral = Math.max(0, 100 - positive - negative)

  const data = [
    { name: "Positive", value: positive, color: "var(--dash-chart-pink)" },
    { name: "Neutral", value: neutral, color: "var(--dash-chart-yellow)" },
    { name: "Negative", value: negative, color: "var(--dash-chart-blue)" },
  ].filter((d) => d.value > 0)

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
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-[var(--dash-text)]">{positive}%</span>
            <span className="text-xs text-[var(--dash-text-faint)]">positive</span>
          </div>
        </div>

        <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="text-[var(--dash-text-mid)]">{item.name}</span>
              <span className="ml-auto font-semibold text-[var(--dash-text)]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
