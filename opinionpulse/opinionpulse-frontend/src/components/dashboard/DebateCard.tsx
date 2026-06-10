import { useNavigate } from "react-router-dom"
import type { LiveDebateItem } from "@/api/dashboard"
import { formatSentimentPct, platformBadge } from "@/lib/api/sentiment"
import { proCard } from "@/lib/ui-classes"
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
    return { label: "HEATED 🔥", className: "bg-red-600 text-white" }
  }
  if (positive > 75 || negative > 75) {
    return { label: "ONE-SIDED", className: "bg-gray-500 text-white" }
  }
  if (debate.total_mentions > 500) {
    return { label: "TRENDING ↑", className: "bg-green-600 text-white" }
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
        proCard,
        "p-5 transition-all duration-150",
        "hover:scale-[1.01] hover:shadow-md"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {badge && (
          <span
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
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
                "rounded px-2 py-0.5 text-[10px] font-semibold",
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
          <div className="bg-green-500" style={{ width: `${pos}%` }} title="For" />
        )}
        {neg > 0 && (
          <div className="bg-red-500" style={{ width: `${neg}%` }} title="Against" />
        )}
        {neu > 0 && (
          <div className="bg-gray-300" style={{ width: `${neu}%` }} title="Neutral" />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span className="text-green-700">{formatSentimentPct(pos)} For</span>
        <span className="text-red-600">{formatSentimentPct(neg)} Against</span>
        <span>{formatSentimentPct(neu)} Neutral</span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          📊 {debate.total_mentions.toLocaleString()} mentions across{" "}
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
    </article>
  )
}
