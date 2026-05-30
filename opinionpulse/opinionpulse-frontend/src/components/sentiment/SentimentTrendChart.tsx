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
import { cardSurface } from "@/lib/ui-classes"

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
        <CardTitle className="text-white">Sentiment trend</CardTitle>
        <p className="text-sm text-slate-400">Daily counts from analyzed mentions</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[280px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-blue-400" />
          </div>
        )}
        {!isLoading && trends.length === 0 && (
          <p className="flex h-[280px] items-center justify-center text-sm text-slate-500">
            No trend data yet. Analyze sentiment after adding mentions.
          </p>
        )}
        {!isLoading && trends.length > 0 && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="positive"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Positive"
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Neutral"
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  stroke="#f87171"
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
