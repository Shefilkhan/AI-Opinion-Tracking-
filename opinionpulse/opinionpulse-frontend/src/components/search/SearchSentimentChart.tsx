import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { SearchResponse } from "@/lib/api/types"
import { proCard, cardTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SearchSentimentChartProps = {
  data: SearchResponse
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string; dataKey?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const volume = payload.find((p) => p.dataKey === "volume")?.value
  const sentimentRows = payload.filter((p) => p.dataKey !== "volume")
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      {typeof volume === "number" && (
        <p className="mt-0.5 text-muted-foreground">{volume} items in bucket</p>
      )}
      {sentimentRows.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  )
}

export function SearchSentimentChart({ data }: SearchSentimentChartProps) {
  const trend = data.sentiment_trend ?? []

  if (trend.length === 0) {
    return (
      <div className={cn(proCard, "p-5")}>
        <h3 className={cn(cardTitle, "mb-2")}>Conversation Volume &amp; Sentiment</h3>
        <p className="text-sm text-muted-foreground">
          Not enough timestamped content to build a sentiment timeline for this period.
        </p>
      </div>
    )
  }

  const chartData = trend.map((p) => ({
    time: p.time,
    positive: p.positive,
    negative: p.negative,
    neutral: p.neutral ?? 0,
    volume: p.volume ?? 0,
  }))

  return (
    <div className={cn(proCard, "p-5")}>
      <h3 className={cn(cardTitle, "mb-1")}>Conversation Volume &amp; Sentiment</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Bars show content volume; lines show sentiment share. Tooltips include sample counts per bucket.
      </p>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.72 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.72 }}
              domain={[0, 100]}
              unit="%"
            />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: "12px", color: "var(--foreground)" }}
            />
            <Bar yAxisId="right" dataKey="volume" fill="var(--muted-foreground)" opacity={0.25} name="Volume" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="positive"
              stroke="#15803d"
              strokeWidth={2}
              dot={false}
              name="Positive"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="negative"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              name="Negative"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="neutral"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Neutral"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
