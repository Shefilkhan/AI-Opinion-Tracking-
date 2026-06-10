/** Shared badge / chip styles using semantic palette tokens */

export const sourceBadgeClass =
  "rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"

export const SOURCE_STYLES: Record<string, string> = {
  manual: sourceBadgeClass,
  reddit: sourceBadgeClass,
  youtube: sourceBadgeClass,
  gdelt: sourceBadgeClass,
  hackernews: sourceBadgeClass,
}

export const SENTIMENT_STYLES: Record<string, string> = {
  positive: "border border-success/20 bg-success/5 text-success",
  negative: "border border-destructive/20 bg-destructive/5 text-destructive",
  neutral: "border border-border bg-muted text-muted-foreground",
}

export const sentimentTextClass = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
} as const

export const statusBadgeClass = {
  ok: "bg-success/5 text-success",
  missing: "bg-muted text-muted-foreground",
} as const
