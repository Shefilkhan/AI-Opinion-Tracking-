import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getProjectSentimentTrends } from "@/api/sentiment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  cardSurface,
  chartColors,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from "@/lib/ui-classes"

type SentimentTrendChartProps = {
  projectId: number
}

export function SentimentTrendChart({ projectId }: SentimentTrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["sentiment-trends", projectId],
    queryFn: () => getProjectSentimentTrends(projectId),
  })

  const trends = data?.trends ?? []

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Sentiment trend</CardTitle>
        <p className="text-sm text-muted-foreground">Daily counts from analyzed mentions</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[280px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && trends.length === 0 && (
          <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No trend data yet. Analyze sentiment after adding mentions.
          </p>
        )}
        {!isLoading && trends.length > 0 && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke={chartColors.axis}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis stroke={chartColors.axis} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="positive"
                  stroke={chartColors.positive}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Positive"
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  stroke={chartColors.neutral}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Neutral"
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  stroke={chartColors.negative}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Negative"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
