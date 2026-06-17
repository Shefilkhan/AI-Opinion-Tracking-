import { useNavigate } from "react-router-dom"
import type { LiveDebateItem } from "@/api/dashboard"
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

  return (
    <article className={cn(dashCardStatic, "flex flex-col gap-3 p-[18px]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {debate.is_heated && (
            <span className="rounded-md bg-[var(--dash-neg-soft)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.02em] text-[var(--dash-neg)]">
              Heated
            </span>
          )}
          {platforms.map((p) => (
            <span
              key={p}
              className="rounded-md bg-[var(--dash-surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--dash-text-mid)]"
            >
              {platformLabel(p)}
            </span>
          ))}
          {extraPlatforms > 0 && (
            <span className="px-1 text-[11px] text-[var(--dash-text-faint)]">
              +{extraPlatforms}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-[var(--dash-text-faint)]">
          {timeLabel}
        </span>
      </div>

      <p className="text-[15px] font-semibold leading-snug text-[var(--dash-text)]">
        {debate.headline}
      </p>

      {debate.summary && (
        <p className="line-clamp-2 text-[13px] text-[var(--dash-text-mid)]">
          {debate.summary}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-[var(--dash-border)] pt-2.5">
        <span className="text-[12.5px] text-[var(--dash-text-mid)]">
          {debate.total_mentions.toLocaleString()} mentions across{" "}
          {debate.platforms.length} platform
          {debate.platforms.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={() =>
            navigate(`/search?q=${encodeURIComponent(debate.topic)}`)
          }
          className="cursor-pointer border-none bg-transparent text-[12.5px] font-semibold text-[var(--dash-accent)]"
        >
          Explore debate →
        </button>
      </div>
    </article>
  )
}
