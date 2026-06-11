import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import type { SearchResponse } from "@/lib/api/types"

type SentimentForecastChartProps = {
  data: SearchResponse
}

export function SentimentForecastChart({ data }: SentimentForecastChartProps) {
  const chartData = useMemo(() => {
    if (!data.sentiment_forecast || data.sentiment_forecast.length === 0) {
      return []
    }
    return data.sentiment_forecast.map((pt) => ({
      name: pt.date,
      score: pt.predicted_score,
      volume: pt.estimated_volume,
      sentiment: pt.sentiment,
    }))
  }, [data])

  if (chartData.length === 0) {
    return null
  }

  const isPredictingPositive = chartData[chartData.length - 1].score > 0

  return (
    <div className={cn(proCard, "p-5 sm:p-6")}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className={sectionTitle}>7-Day Sentiment Forecast</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-driven extrapolation based on data velocity and historical momentum.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1">
          <span className="relative flex size-2">
            <span className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              isPredictingPositive ? "bg-emerald-400" : "bg-red-400"
            )}></span>
            <span className={cn(
              "relative inline-flex size-2 rounded-full",
              isPredictingPositive ? "bg-emerald-500" : "bg-red-500"
            )}></span>
          </span>
          <span className="text-xs font-medium text-foreground">
            Predicting {isPredictingPositive ? "Uptrend" : "Downtrend"}
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tickFormatter={(val) => val === 0 ? "Neutral" : val > 0 ? "Positive" : "Negative"}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div className="rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
                      <p className="mb-1 text-sm font-semibold text-foreground">{d.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Score:</span>
                        <span className={cn(
                          "font-medium",
                          d.score > 0 ? "text-emerald-500" : d.score < 0 ? "text-red-500" : "text-gray-500"
                        )}>
                          {d.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Est. Volume:</span>
                        <span className="font-medium text-foreground">{d.volume}</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.3} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
