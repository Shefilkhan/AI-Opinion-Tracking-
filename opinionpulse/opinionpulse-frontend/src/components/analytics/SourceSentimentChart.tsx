import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
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
import { getSourceSentiment } from "@/api/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface, chartColors, chartTooltipStyle } from "@/lib/ui-classes"

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  reddit: "Reddit",
  youtube: "YouTube",
  gdelt: "GDELT",
  hackernews: "HN",
}

type SourceSentimentChartProps = {
  projectId: number
}

export function SourceSentimentChart({ projectId }: SourceSentimentChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-source-sentiment", projectId],
    queryFn: () => getSourceSentiment(projectId),
  })

  const hasData = data?.some((d) => d.total > 0) ?? false
  const chartData =
    data?.map((d) => ({
      source: SOURCE_LABELS[d.source] ?? d.source,
      positive: d.positive,
      neutral: d.neutral,
      negative: d.negative,
    })) ?? []

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Sentiment by source</CardTitle>
        <p className="text-sm text-muted-foreground">Stacked counts per data source</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[280px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && !hasData && (
          <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No mentions by source yet.
          </p>
        )}
        {!isLoading && hasData && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="source" stroke={chartColors.axis} tick={{ fontSize: 11 }} />
                <YAxis stroke={chartColors.axis} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Bar dataKey="positive" stackId="a" fill={chartColors.positive} name="Positive" />
                <Bar dataKey="neutral" stackId="a" fill={chartColors.neutral} name="Neutral" />
                <Bar dataKey="negative" stackId="a" fill={chartColors.negative} name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
