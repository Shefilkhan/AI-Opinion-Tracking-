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
import type { SearchResponse } from "@/lib/api/types"

type SearchSentimentChartProps = {
  data: SearchResponse
}

export function SearchSentimentChart({ data }: SearchSentimentChartProps) {
  const chartData = data.sentiment_trend.map((p) => ({
    time: p.time,
    positive: p.positive,
    negative: p.negative,
    volume: p.volume,
  }))

  if (chartData.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Sentiment trend</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="positive"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Positive"
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Negative"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
