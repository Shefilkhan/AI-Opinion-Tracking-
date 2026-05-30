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
import { cardSurface } from "@/lib/ui-classes"

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
        <CardTitle className="text-white">Sentiment by source</CardTitle>
        <p className="text-sm text-slate-400">Stacked counts per data source</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[280px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-blue-400" />
          </div>
        )}
        {!isLoading && !hasData && (
          <p className="flex h-[280px] items-center justify-center text-sm text-slate-500">
            No mentions by source yet.
          </p>
        )}
        {!isLoading && hasData && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="source" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="positive" stackId="a" fill="#34d399" name="Positive" />
                <Bar dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" />
                <Bar dataKey="negative" stackId="a" fill="#f87171" name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
