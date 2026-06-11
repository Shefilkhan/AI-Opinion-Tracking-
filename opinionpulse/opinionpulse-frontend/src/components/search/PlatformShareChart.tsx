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

// Colors for the donut chart
const COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#64748B", // slate
]

export function PlatformShareChart({ data }: PlatformShareChartProps) {
  const counts: Record<string, number> = {}

  data.results.forEach((r) => {
    counts[r.platform] = (counts[r.platform] || 0) + 1
  })

  const chartData = Object.keys(counts)
    .map((platform) => ({
      name: platformDisplayName(platform),
      value: counts[platform],
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, idx) => ({
      ...item,
      color: COLORS[idx % COLORS.length]
    }))

  return (
    <div className={cn(proCard, "p-5 flex flex-col")}>
      <h3 className={cn(cardTitle, "mb-4")}>
        Share of Voice
      </h3>
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
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="font-medium text-foreground">{data.name}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{data.value} mentions</p>
                  </div>
                )
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
