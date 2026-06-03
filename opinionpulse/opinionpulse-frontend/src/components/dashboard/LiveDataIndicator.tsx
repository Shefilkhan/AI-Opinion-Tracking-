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

function SourceDot({
  label,
  live,
}: {
  label: string
  live: boolean
}) {
  return (
    <span className={live ? "text-green-600" : "text-gray-400"}>
      ● {label} {live ? "Live" : "Off"}
    </span>
  )
}

export function LiveDataIndicator({ isLive, lastUpdated }: LiveDataIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
      <span>Data sources:</span>
      <SourceDot label="Reddit" live={isLive.reddit ?? true} />
      <SourceDot label="Dev.to" live={isLive.devto ?? true} />
      <SourceDot label="HN" live={isLive.hackernews ?? true} />
      <SourceDot label="News" live={!!(isLive.newsapi || isLive.guardian || isLive.gnews)} />
      <SourceDot label="YouTube" live={!!isLive.youtube} />
      <span className="text-gray-300">Updated {timeAgo(lastUpdated)}</span>
    </div>
  )
}
