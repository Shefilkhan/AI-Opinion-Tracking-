import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { getSentimentDistribution } from "@/api/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface, chartColors, chartTooltipStyle } from "@/lib/ui-classes"

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
        <CardTitle className="text-foreground">Sentiment distribution</CardTitle>
        <p className="text-sm text-muted-foreground">Share of analyzed mentions by label</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[260px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && !hasData && (
          <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
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
                    <Cell key={entry.label} fill={chartColors[entry.label as keyof typeof chartColors] ?? chartColors.neutral} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
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
