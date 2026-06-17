import { dashCardStatic } from "@/lib/dash-classes"
import { formatUpdatedLabel } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type LiveDataIndicatorProps = {
  isLive: Record<string, boolean>
  lastUpdated?: string | null
}

const SOURCE_DEFS = [
  { key: "reddit", name: "Reddit" },
  { key: "devto", name: "Dev.to" },
  { key: "hackernews", name: "HN" },
  { key: "bluesky", name: "Bluesky" },
  { key: "mastodon", name: "Mastodon" },
  { key: "github", name: "GitHub" },
  { key: "news", name: "News" },
  { key: "youtube", name: "YouTube" },
] as const

export function LiveDataIndicator({ isLive, lastUpdated }: LiveDataIndicatorProps) {
  const sources = SOURCE_DEFS.map((s) => {
    if (s.key === "news") {
      return {
        name: s.name,
        live: !!(isLive.newsapi || isLive.guardian || isLive.gnews),
      }
    }
    return { name: s.name, live: isLive[s.key] ?? s.key !== "youtube" }
  })

  return (
    <div
      className={cn(
        dashCardStatic,
        "flex flex-wrap items-center gap-2 px-4 py-3"
      )}
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--dash-text-faint)]">
        Sources
      </span>
      {sources.map((s) => (
        <span
          key={s.name}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            s.live
              ? "bg-[var(--dash-pos-soft)] text-[var(--dash-pos)]"
              : "bg-[var(--dash-surface-alt)] text-[var(--dash-text-faint)]"
          )}
        >
          <span
            className={cn(
              "size-[5px] rounded-full",
              s.live ? "bg-[var(--dash-pos)]" : "bg-[var(--dash-text-faint)]"
            )}
            aria-hidden
          />
          {s.name}
        </span>
      ))}
      <span className="ml-auto text-xs text-[var(--dash-text-faint)]">
        {formatUpdatedLabel(lastUpdated)}
      </span>
    </div>
  )
}
