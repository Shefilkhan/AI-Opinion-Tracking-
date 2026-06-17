/** Format relative time for live dashboard content; clamps stale timestamps. */

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "Recently"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "Recently"

  const diffMs = Date.now() - then
  if (diffMs < 0) return "Just now"

  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days <= 7) return `${days}d ago`
  return "Recently"
}

/** Prefer posted_at; fall back to API string but hide absurd ages for live debates. */
export function formatLiveDebateTimeAgo(
  timeAgo: string,
  postedAt?: string
): string {
  if (postedAt) {
    return formatRelativeTime(postedAt)
  }

  const dayMatch = timeAgo.match(/^(\d+)d ago$/i)
  if (dayMatch && parseInt(dayMatch[1], 10) > 7) {
    return "Recently"
  }

  const hourMatch = timeAgo.match(/^(\d+)\s*hours?\s*ago$/i)
  if (hourMatch && parseInt(hourMatch[1], 10) > 48) {
    return "Recently"
  }

  return timeAgo || "Recently"
}

export function formatUpdatedLabel(iso?: string | null): string {
  const rel = formatRelativeTime(iso)
  if (rel === "Recently") return "Updated recently"
  if (rel === "Just now") return "Updated just now"
  return `Updated ${rel.replace(" ago", "")}`
}
