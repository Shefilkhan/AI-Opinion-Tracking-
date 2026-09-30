import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { SearchResponse } from "@/lib/api/types"
import { proCard, cardTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { platformDisplayName } from "@/lib/api/sentiment"

type PlatformSentimentChartProps = {
  data: SearchResponse
}

export function PlatformSentimentChart({ data }: PlatformSentimentChartProps) {
  const stats = data.search_intelligence?.platform_stats

  const chartData = stats?.length
    ? stats.slice(0, 8).map((p) => ({
        name: platformDisplayName(p.platform),
        positive: p.sentiment.positive,
        neutral: p.sentiment.neutral,
        negative: p.sentiment.negative,
        total: p.content_count,
      }))
    : (() => {
        const counts: Record<string, { positive: number; neutral: number; negative: number }> = {}
        data.results.forEach((r) => {
          if (!counts[r.platform]) {
            counts[r.platform] = { positive: 0, neutral: 0, negative: 0 }
          }
          const sentiment = r.sentiment || "neutral"
          counts[r.platform][sentiment]++
        })
        return Object.keys(counts)
          .map((platform) => {
            const c = counts[platform]
            const total = c.positive + c.neutral + c.negative || 1
            return {
              name: platformDisplayName(platform),
              positive: Math.round((c.positive / total) * 100),
              neutral: Math.round((c.neutral / total) * 100),
              negative: Math.round((c.negative / total) * 100),
              total: c.positive + c.neutral + c.negative,
            }
          })
          .sort((a, b) => b.total - a.total)
          .slice(0, 6)
      })()

  if (chartData.length === 0) {
    return (
      <div className={cn(proCard, "p-5 flex flex-col")}>
        <h3 className={cn(cardTitle, "mb-4")}>Sentiment by Platform</h3>
        <p className="text-sm text-muted-foreground">Not enough platform data to chart sentiment breakdown.</p>
      </div>
    )
  }

  return (
    <div className={cn(proCard, "p-5 flex flex-col")}>
      <h3 className={cn(cardTitle, "mb-1")}>Sentiment by Platform</h3>
      <p className="mb-4 text-xs text-muted-foreground">Stacked bars show sentiment share per platform (%).</p>
      <div className="h-[220px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.72 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.72 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const total = payload[0]?.payload?.total
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-medium text-foreground">{label}</p>
                    {typeof total === "number" && (
                      <p className="mb-1 text-muted-foreground">{total} items analyzed</p>
                    )}
                    {payload.map((p, i) => (
                      <p key={String(p.dataKey ?? p.name ?? i)} style={{ color: p.color }}>
                        {p.name}: {p.value}%
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", color: "var(--foreground)" }}
            />
            <Bar dataKey="positive" name="Positive" stackId="a" fill="#15803d" />
            <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#64748b" />
            <Bar dataKey="negative" name="Negative" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
