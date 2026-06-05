import type { SearchResponse } from "@/lib/api/types"
import { formatSentimentPct, platformDisplayName } from "@/lib/api/sentiment"

type OpinionSummaryCardProps = {
  data: SearchResponse
  timeLabel: string
}

export function OpinionSummaryCard({ data, timeLabel }: OpinionSummaryCardProps) {
  const s = data.sentiment_summary
  const pos = Math.round(s.positive)
  const neg = Math.round(s.negative)
  const neu = Math.round(s.neutral)

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30] p-6">
      <h2 className="text-lg font-semibold text-foreground">
        Results for: &ldquo;{data.query}&rdquo;
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.total_results.toLocaleString()} mentions found • {timeLabel}
      </p>

      <div className="mt-6">
        <p className="text-sm font-medium text-foreground">Overall Sentiment</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-md">
          {pos > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${pos}%` }}
              title={`${pos}% positive`}
            />
          )}
          {neg > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${neg}%` }}
              title={`${neg}% negative`}
            />
          )}
          {neu > 0 && (
            <div
              className="bg-gray-300 transition-all"
              style={{ width: `${neu}%` }}
              title={`${neu}% neutral`}
            />
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span className="text-green-700">{formatSentimentPct(pos)} Positive</span>
          <span className="text-red-600">{formatSentimentPct(neg)} Negative</span>
          <span>{formatSentimentPct(neu)} Neutral</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-[10px] bg-[#F0FDF4] px-4 py-4 text-center">
          <span className="text-2xl" aria-hidden>
            😊
          </span>
          <p className="mt-2 text-[32px] font-bold leading-none text-[#16A34A]">
            {formatSentimentPct(pos)}
          </p>
          <p className="mt-1 text-[13px] text-gray-500">Positive</p>
        </div>
        <div className="rounded-[10px] bg-[#F9FAFB] px-4 py-4 text-center">
          <span className="text-2xl" aria-hidden>
            😐
          </span>
          <p className="mt-2 text-[32px] font-bold leading-none text-[#6B7280]">
            {formatSentimentPct(neu)}
          </p>
          <p className="mt-1 text-[13px] text-gray-500">Neutral</p>
        </div>
        <div className="rounded-[10px] bg-[#FEF2F2] px-4 py-4 text-center">
          <span className="text-2xl" aria-hidden>
            😠
          </span>
          <p className="mt-2 text-[32px] font-bold leading-none text-[#DC2626]">
            {formatSentimentPct(neg)}
          </p>
          <p className="mt-1 text-[13px] text-gray-500">Negative</p>
        </div>
      </div>

      {(data.peak_discussion || data.most_active_platform) && (
        <p className="mt-4 text-xs text-muted-foreground">
          {data.peak_discussion && (
            <span>📈 Peak discussion: {data.peak_discussion}</span>
          )}
          {data.peak_discussion && data.most_active_platform && (
            <span className="mx-2">•</span>
          )}
          {data.most_active_platform && (
            <span>
              Most active: {platformDisplayName(data.most_active_platform)}
            </span>
          )}
        </p>
      )}
    </div>
  )
}
