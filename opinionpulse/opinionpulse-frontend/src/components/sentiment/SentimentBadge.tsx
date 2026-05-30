import { Badge } from "@/components/ui/badge"
import type { SentimentBrief } from "@/api/sentiment"
import { cn } from "@/lib/utils"

const LABEL_STYLES: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  negative: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  neutral: "bg-slate-500/15 text-slate-300 border-slate-500/30",
}

type SentimentBadgeProps = {
  sentiment: SentimentBrief | null | undefined
  showDetails?: boolean
}

export function SentimentBadge({ sentiment, showDetails = false }: SentimentBadgeProps) {
  if (!sentiment) {
    return (
      <Badge variant="outline" className="border-slate-600 text-slate-400">
        Not analyzed
      </Badge>
    )
  }

  const label = sentiment.sentiment_label
  const display =
    label === "positive" ? "Positive" : label === "negative" ? "Negative" : "Neutral"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        className={cn(
          "capitalize border",
          LABEL_STYLES[label] ?? "bg-slate-700 text-slate-300"
        )}
      >
        {display}
      </Badge>
      {showDetails && (
        <span className="text-xs text-slate-500">
          Score: {sentiment.sentiment_score.toFixed(2)} · Confidence:{" "}
          {sentiment.confidence.toFixed(2)} · {sentiment.model_name}
        </span>
      )}
    </div>
  )
}
