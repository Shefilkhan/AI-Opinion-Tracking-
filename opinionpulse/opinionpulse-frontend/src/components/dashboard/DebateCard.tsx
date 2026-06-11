import { useNavigate } from "react-router-dom"
import type { LiveDebateItem } from "@/api/dashboard"
import { formatSentimentPct, platformBadge } from "@/lib/api/sentiment"
import { cardInteractive } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type DebateCardProps = {
  debate: LiveDebateItem
}

function debateBadge(debate: LiveDebateItem): {
  label: string
  className: string
} | null {
  const { positive, negative } = debate.sentiment
  if (debate.is_heated || Math.abs(positive - negative) <= 15) {
    return { label: "Heated", className: "border-destructive/30 bg-destructive/10 text-destructive" }
  }
  if (positive > 75 || negative > 75) {
    return { label: "One-sided", className: "border-border bg-muted/40 text-muted-foreground" }
  }
  if (debate.total_mentions > 500) {
    return { label: "Trending", className: "border-success/30 bg-success/10 text-success" }
  }
  return null
}

export function DebateCard({ debate }: DebateCardProps) {
  const navigate = useNavigate()
  const badge = debateBadge(debate)
  const pos = debate.sentiment.positive
  const neg = debate.sentiment.negative
  const neu = debate.sentiment.neutral

  return (
    <article
      className={cn(
        cardInteractive,
        "group relative overflow-hidden p-5"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
      <div className="flex flex-wrap items-center gap-2">
        {badge && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}
        {debate.platforms.map((p) => {
          const plat = platformBadge(p)
          return (
            <span
              key={p}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                plat.className
              )}
            >
              {plat.label}
            </span>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {debate.time_ago}
        </span>
      </div>

      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-foreground">
        {debate.headline}
      </h3>
      <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{debate.summary}</p>

      <div className="mt-4 flex h-3 overflow-hidden rounded-md">
        {pos > 0 && (
          <div className="bg-success" style={{ width: `${pos}%` }} title="For" />
        )}
        {neg > 0 && (
          <div className="bg-destructive" style={{ width: `${neg}%` }} title="Against" />
        )}
        {neu > 0 && (
          <div className="bg-muted-foreground/30" style={{ width: `${neu}%` }} title="Neutral" />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span className="text-success">{formatSentimentPct(pos)} For</span>
        <span className="text-destructive">{formatSentimentPct(neg)} Against</span>
        <span>{formatSentimentPct(neu)} Neutral</span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {debate.total_mentions.toLocaleString()} mentions across{" "}
          {debate.platforms.length} platform
          {debate.platforms.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() =>
            navigate(`/search?q=${encodeURIComponent(debate.topic)}`)
          }
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Explore debate →
        </button>
      </div>
      </div>
    </article>
  )
}
