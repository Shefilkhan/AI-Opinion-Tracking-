import { StatusPill } from "@/components/layout/StatusPill"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type LiveDataIndicatorProps = {
  isLive: Record<string, boolean>
  lastUpdated?: string | null
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "recently"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function LiveDataIndicator({ isLive, lastUpdated }: LiveDataIndicatorProps) {
  const sources = [
    { label: "Reddit", live: isLive.reddit ?? true },
    { label: "Dev.to", live: isLive.devto ?? true },
    { label: "HN", live: isLive.hackernews ?? true },
    {
      label: "News",
      live: !!(isLive.newsapi || isLive.guardian || isLive.gnews),
    },
    { label: "YouTube", live: !!isLive.youtube },
  ]

  return (
    <div className={cn(proCard, "flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5")}>
      <span className="mr-1 text-xs font-medium text-muted-foreground">Data sources</span>
      {sources.map((s) => (
        <StatusPill
          key={s.label}
          label={s.live ? `${s.label} Live` : `${s.label} Off`}
          live={s.live}
        />
      ))}
      <span className="ml-auto text-xs text-muted-foreground">
        Updated {timeAgo(lastUpdated)}
      </span>
    </div>
  )
}
