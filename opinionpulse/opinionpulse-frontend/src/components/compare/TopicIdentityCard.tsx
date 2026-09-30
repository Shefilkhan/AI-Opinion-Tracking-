import { Link } from "react-router-dom"
import { ExternalLink } from "lucide-react"
import type { SearchResponse } from "@/lib/api/types"
import { platformDisplayName } from "@/lib/api/sentiment"
import {
  activeSourceCount,
  analyzedTotal,
  contentBreakdown,
  sentimentPct,
} from "@/lib/compare-analytics"
import { cn } from "@/lib/utils"

type TopicIdentityCardProps = {
  data: SearchResponse
  name: string
  side: "a" | "b"
}

export function TopicIdentityCard({ data, name, side }: TopicIdentityCardProps) {
  const breakdown = contentBreakdown(data)
  const tone = data.topic_summary?.sentiment_tone ?? "Mixed"
  const platform = data.most_active_platform
    ? platformDisplayName(data.most_active_platform)
    : "—"

  return (
    <article
      className={cn(
        "compare-identity-card",
        side === "a" ? "compare-topic-a" : "compare-topic-b"
      )}
    >
      <p className="compare-section-label m-0">{name}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--dash-text)]">
        {analyzedTotal(data).toLocaleString()}
        <span className="ml-1 text-sm font-medium text-[var(--dash-text-faint)]">
          analyzed items
        </span>
      </p>
      <p className="mt-1 text-xs text-[var(--dash-text-mid)]">
        {activeSourceCount(data)} active sources · {tone}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="compare-section-label">Positive</p>
          <p className="text-sm font-semibold text-emerald-600">{sentimentPct(data, "positive")}%</p>
        </div>
        <div>
          <p className="compare-section-label">Neutral</p>
          <p className="text-sm font-semibold text-[var(--dash-text-mid)]">
            {sentimentPct(data, "neutral")}%
          </p>
        </div>
        <div>
          <p className="compare-section-label">Negative</p>
          <p className="text-sm font-semibold text-red-600">{sentimentPct(data, "negative")}%</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--dash-text-faint)]">
        Primary source · <strong className="text-[var(--dash-text)]">{platform}</strong>
      </p>
      {breakdown.comments > 0 && (
        <p className="mt-1 text-[11px] text-[var(--dash-text-faint)]">
          Primary {breakdown.primary} · Comments {breakdown.comments}
          {breakdown.replies ? ` · Replies ${breakdown.replies}` : ""}
        </p>
      )}
      <Link
        to={`/search?q=${encodeURIComponent(name)}`}
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--dash-accent)] hover:underline"
      >
        Open full analysis
        <ExternalLink className="size-3" />
      </Link>
    </article>
  )
}
