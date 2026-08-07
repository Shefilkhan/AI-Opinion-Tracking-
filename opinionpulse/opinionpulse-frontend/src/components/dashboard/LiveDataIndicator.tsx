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
    return { name: s.name, live: isLive[s.key] ?? false }
  })

  return (
    <div
      className={cn(
        dashCardStatic,
        "flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5"
      )}
    >
      <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--dash-text-faint)]">
        Sources
      </span>
      {sources.map((s) => (
        <span
          key={s.name}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            s.live
              ? "border-[var(--dash-pos-soft)] bg-[var(--dash-pos-soft)] text-[var(--dash-pos)]"
              : "border-[var(--dash-border)] bg-[var(--dash-surface-alt)] text-[var(--dash-text-faint)]"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              s.live ? "bg-[var(--dash-pos)]" : "bg-[var(--dash-text-faint)]"
            )}
            aria-hidden
          />
          {s.name}
        </span>
      ))}
      {lastUpdated && (
        <span className="ml-auto text-[11px] text-[var(--dash-text-faint)]">
          {formatUpdatedLabel(lastUpdated)}
        </span>
      )}
    </div>
  )
}
