import { useNavigate } from "react-router-dom"
import type { LiveDebateItem } from "@/api/dashboard"
import { DebateMedia } from "@/components/dashboard/DebateMedia"
import { SentimentSplitBar } from "@/components/dashboard/SentimentSplitBar"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatLiveDebateTimeAgo } from "@/lib/formatTimeAgo"
import { platformLabel } from "@/lib/platformDots"
import { cn } from "@/lib/utils"

type DebateCardProps = {
  debate: LiveDebateItem
}

export function DebateCard({ debate }: DebateCardProps) {
  const navigate = useNavigate()
  const platforms = debate.platforms.slice(0, 3)
  const extraPlatforms = debate.platforms.length - platforms.length
  const timeLabel = formatLiveDebateTimeAgo(debate.time_ago, debate.posted_at)
  const primaryPlatform = debate.platforms[0] ?? "news"

  return (
    <article
      className={cn(
        dashCardStatic,
        "group flex h-full flex-col overflow-hidden p-0"
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex gap-3">
          <DebateMedia
            platform={primaryPlatform}
            thumbnail={debate.thumbnail}
            title={debate.headline}
            sourceLabel={debate.source_label}
            className="h-[72px] w-[96px] sm:h-[80px] sm:w-[108px]"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {debate.is_heated && (
                <span className="rounded-md bg-[var(--dash-neg-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--dash-neg)]">
                  Heated
                </span>
              )}
              {platforms.map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-[var(--dash-surface-alt)] px-2 py-0.5 text-[10px] font-medium text-[var(--dash-text-mid)]"
                >
                  {platformLabel(p)}
                </span>
              ))}
              {extraPlatforms > 0 && (
                <span className="text-[10px] text-[var(--dash-text-faint)]">
                  +{extraPlatforms}
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--dash-text)]">
              {debate.headline}
            </p>
            <p className="mt-1 text-[11px] text-[var(--dash-text-faint)]">
              {timeLabel}
            </p>
          </div>
        </div>

        {debate.summary && (
          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--dash-text-mid)]">
            {debate.summary}
          </p>
        )}

        <SentimentSplitBar
          positive={debate.sentiment.positive}
          negative={debate.sentiment.negative}
          neutral={debate.sentiment.neutral}
          showLegend={false}
        />

        <div className="mt-auto flex items-center justify-between border-t border-[var(--dash-border)] pt-2.5">
          <span className="text-[11.5px] text-[var(--dash-text-mid)]">
            {debate.total_mentions.toLocaleString()} mentions
          </span>
          <button
            type="button"
            onClick={() =>
              navigate(`/search?q=${encodeURIComponent(debate.topic)}`)
            }
            className="cursor-pointer border-none bg-transparent text-[12px] font-semibold text-[var(--dash-accent)] transition-opacity hover:opacity-80"
          >
            Explore debate →
          </button>
        </div>
      </div>
    </article>
  )
}
