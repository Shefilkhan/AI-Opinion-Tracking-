import type { SearchResponse } from "@/lib/api/types"
import { platformDisplayName } from "@/lib/api/sentiment"

type OpinionSummaryCardProps = {
  data: SearchResponse
  timeLabel: string
}

export function OpinionSummaryCard({ data, timeLabel }: OpinionSummaryCardProps) {
  const s = data.sentiment_summary
  const pos = s.positive

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-foreground">
        Results for: &ldquo;{data.query}&rdquo;
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.total_results.toLocaleString()} mentions found • {timeLabel}
      </p>
      <div className="mt-6">
        <p className="text-sm font-medium text-foreground">Overall Sentiment</p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${pos}%` }}
          />
        </div>
        <p className="mt-1 text-sm text-green-700">{pos}% Positive</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <span className="text-lg">😊</span>
          <p className="font-medium text-green-700">{s.positive}% Positive</p>
        </div>
        <div>
          <span className="text-lg">😐</span>
          <p className="font-medium text-gray-600">{s.neutral}% Neutral</p>
        </div>
        <div>
          <span className="text-lg">😠</span>
          <p className="font-medium text-red-600">{s.negative}% Negative</p>
        </div>
      </div>
      {data.peak_discussion && (
        <p className="mt-4 text-xs text-muted-foreground">
          Peak discussion: {data.peak_discussion}
        </p>
      )}
      {data.most_active_platform && (
        <p className="text-xs text-muted-foreground">
          Most active platform: {platformDisplayName(data.most_active_platform)}
        </p>
      )}
    </div>
  )
}
