import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { getSentimentDistribution } from "@/api/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

const COLORS: Record<string, string> = {
  positive: "#34d399",
  neutral: "#94a3b8",
  negative: "#f87171",
}

type SentimentDistributionChartProps = {
  projectId: number
}

export function SentimentDistributionChart({
  projectId,
}: SentimentDistributionChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-distribution", projectId],
    queryFn: () => getSentimentDistribution(projectId),
  })

  const hasData = data?.some((d) => d.count > 0) ?? false
  const chartData =
    data?.map((d) => ({
      name: d.label.charAt(0).toUpperCase() + d.label.slice(1),
      value: d.count,
      label: d.label,
      percentage: d.percentage,
    })) ?? []

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-white">Sentiment distribution</CardTitle>
        <p className="text-sm text-slate-400">Share of analyzed mentions by label</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[260px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-blue-400" />
          </div>
        )}
        {!isLoading && !hasData && (
          <p className="flex h-[260px] items-center justify-center text-sm text-slate-500">
            No analyzed mentions yet. Run Analyze Sentiment first.
          </p>
        )}
        {!isLoading && hasData && (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={COLORS[entry.label] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value, _name, item) => {
                    const pct = item?.payload?.percentage
                    return [
                      `${value} (${typeof pct === "number" ? pct.toFixed(1) : 0}%)`,
                      "Mentions",
                    ]
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
