import type { SearchResponse } from "@/lib/api/types"
import { formatSentimentPct, platformDisplayName } from "@/lib/api/sentiment"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

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
    <div className={cn(proCard, "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cn(sectionTitle, "text-xl")}>
            &ldquo;{data.query}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">
              {data.total_results.toLocaleString()}
            </span>{" "}
            mentions found · {timeLabel}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Overall Sentiment
        </p>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
          {pos > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${pos}%` }}
              title={`${pos}% positive`}
            />
          )}
          {neu > 0 && (
            <div
              className="bg-gray-400 transition-all"
              style={{ width: `${neu}%` }}
              title={`${neu}% neutral`}
            />
          )}
          {neg > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${neg}%` }}
              title={`${neg}% negative`}
            />
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs font-medium">
          <span className="text-green-600 dark:text-green-400">
            {formatSentimentPct(pos)} Positive
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {formatSentimentPct(neu)} Neutral
          </span>
          <span className="text-red-600 dark:text-red-400">
            {formatSentimentPct(neg)} Negative
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            emoji: "😊",
            value: pos,
            label: "Positive",
            bg: "bg-green-50 dark:bg-green-500/10",
            text: "text-green-600 dark:text-green-400",
          },
          {
            emoji: "😐",
            value: neu,
            label: "Neutral",
            bg: "bg-muted",
            text: "text-muted-foreground",
          },
          {
            emoji: "😠",
            value: neg,
            label: "Negative",
            bg: "bg-red-50 dark:bg-red-500/10",
            text: "text-red-600 dark:text-red-400",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-xl px-3 py-4 text-center sm:px-4",
              item.bg
            )}
          >
            <span className="text-xl sm:text-2xl" aria-hidden>
              {item.emoji}
            </span>
            <p className={cn("mt-2 text-2xl font-bold leading-none sm:text-3xl", item.text)}>
              {formatSentimentPct(item.value)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {(data.peak_discussion || data.most_active_platform) && (
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          {data.peak_discussion && (
            <span>📈 Peak discussion: {data.peak_discussion}</span>
          )}
          {data.peak_discussion && data.most_active_platform && (
            <span className="mx-2">·</span>
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
