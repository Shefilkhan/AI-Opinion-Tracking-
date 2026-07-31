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
  // Aggregate sentiment counts by platform
  const counts: Record<string, { positive: number; neutral: number; negative: number }> = {}

  data.results.forEach((r) => {
    if (!counts[r.platform]) {
      counts[r.platform] = { positive: 0, neutral: 0, negative: 0 }
    }
    const sentiment = r.sentiment || "neutral"
    counts[r.platform][sentiment]++
  })

  const chartData = Object.keys(counts)
    .map((platform) => ({
      name: platformDisplayName(platform),
      positive: counts[platform].positive,
      neutral: counts[platform].neutral,
      negative: counts[platform].negative,
      total: counts[platform].positive + counts[platform].neutral + counts[platform].negative,
    }))
    .sort((a, b) => b.total - a.total) // Sort by volume descending
    .slice(0, 6) // Show top 6 platforms

  if (chartData.length === 0) {
    return (
      <div className={cn(proCard, "p-5 flex flex-col")}>
        <h3 className={cn(cardTitle, "mb-4")}>Sentiment by Platform</h3>
        <p className="text-sm text-muted-foreground">
          Not enough platform data to chart yet.
        </p>
      </div>
    )
  }

  return (
    <div className={cn(proCard, "p-5 flex flex-col")}>
      <h3 className={cn(cardTitle, "mb-4")}>
        Sentiment by Platform
      </h3>
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
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <p className="font-medium text-foreground mb-1">{label}</p>
                    {payload.map((p, i) => (
                      <p key={String(p.dataKey ?? p.name ?? i)} style={{ color: p.color }}>
                        {p.name}: {p.value}
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
            <Bar dataKey="positive" name="Positive" stackId="a" fill="#15803d" radius={[0, 0, 0, 0]} />
            <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#64748b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="negative" name="Negative" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
