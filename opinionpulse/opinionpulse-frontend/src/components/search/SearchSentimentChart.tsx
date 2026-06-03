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

const FALLBACK_TREND = [
  { time: "12AM", positive: 42, negative: 28, neutral: 30 },
  { time: "2AM", positive: 38, negative: 35, neutral: 27 },
  { time: "4AM", positive: 45, negative: 25, neutral: 30 },
  { time: "6AM", positive: 52, negative: 22, neutral: 26 },
  { time: "8AM", positive: 48, negative: 30, neutral: 22 },
  { time: "10AM", positive: 55, negative: 28, neutral: 17 },
  { time: "12PM", positive: 60, negative: 20, neutral: 20 },
  { time: "2PM", positive: 65, negative: 18, neutral: 17 },
  { time: "4PM", positive: 58, negative: 25, neutral: 17 },
  { time: "6PM", positive: 50, negative: 32, neutral: 18 },
  { time: "8PM", positive: 45, negative: 35, neutral: 20 },
  { time: "10PM", positive: 48, negative: 30, neutral: 22 },
]

type SearchSentimentChartProps = {
  data: SearchResponse
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  )
}

export function SearchSentimentChart({ data }: SearchSentimentChartProps) {
  const source =
    data.sentiment_trend.length > 0 ? data.sentiment_trend : FALLBACK_TREND
  const chartData = source.map((p) => ({
    time: p.time,
    positive: p.positive,
    negative: p.negative,
    neutral: p.neutral ?? 0,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Sentiment Trend — Last 24 Hours
      </h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
            <Line
              type="monotone"
              dataKey="positive"
              stroke="#16A34A"
              strokeWidth={2}
              dot={false}
              name="Positive"
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              name="Negative"
            />
            <Line
              type="monotone"
              dataKey="neutral"
              stroke="#9CA3AF"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Neutral"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
