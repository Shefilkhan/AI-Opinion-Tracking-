import { Badge } from "@/components/ui/badge"
import type { SentimentBrief } from "@/api/sentiment"
import { SENTIMENT_STYLES } from "@/lib/badge-styles"
import { cn } from "@/lib/utils"

type SentimentBadgeProps = {
  sentiment: SentimentBrief | null | undefined
  showDetails?: boolean
}

export function SentimentBadge({ sentiment, showDetails = false }: SentimentBadgeProps) {
  if (!sentiment) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
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
          "capitalize",
          SENTIMENT_STYLES[label] ?? "border border-gray-200 bg-muted text-muted-foreground"
        )}
      >
        {display}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          Score: {sentiment.sentiment_score.toFixed(2)} · Confidence:{" "}
          {sentiment.confidence.toFixed(2)} · {sentiment.model_name}
        </span>
      )}
    </div>
  )
}
