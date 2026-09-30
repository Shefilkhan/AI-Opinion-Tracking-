import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { SearchResponse } from "@/lib/api/types"
import { proCard, cardTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { platformDisplayName } from "@/lib/api/sentiment"

type PlatformShareChartProps = {
  data: SearchResponse
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"]

export function PlatformShareChart({ data }: PlatformShareChartProps) {
  const stats = data.search_intelligence?.platform_stats

  const chartData = stats?.length
    ? stats.map((p, idx) => ({
        name: platformDisplayName(p.platform),
        value: p.content_count,
        share: p.share_pct,
        color: COLORS[idx % COLORS.length],
      }))
    : (() => {
        const counts: Record<string, number> = {}
        data.results.forEach((r) => {
          counts[r.platform] = (counts[r.platform] || 0) + 1
        })
        return Object.keys(counts)
          .map((platform, idx) => ({
            name: platformDisplayName(platform),
            value: counts[platform],
            share: 0,
            color: COLORS[idx % COLORS.length],
          }))
          .sort((a, b) => b.value - a.value)
      })()

  if (chartData.length === 0) {
    return (
      <div className={cn(proCard, "p-5 flex flex-col")}>
        <h3 className={cn(cardTitle, "mb-4")}>Share of Analyzed Content</h3>
        <p className="text-sm text-muted-foreground">Not enough platform data to calculate share of voice.</p>
      </div>
    )
  }

  return (
    <div className={cn(proCard, "p-5 flex flex-col")}>
      <h3 className={cn(cardTitle, "mb-1")}>Share of Analyzed Content</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Percentage of all analyzed content by platform (includes comments and replies where sampled).
      </p>
      <div className="h-[220px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as (typeof chartData)[number]
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium text-foreground">{row.name}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {row.value} items{row.share > 0 ? ` · ${row.share}%` : ""}
                    </p>
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
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
