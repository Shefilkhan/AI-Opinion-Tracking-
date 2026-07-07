import { useState } from "react"
import { ExternalLink, Heart, Loader2, MessageCircle, Play, Repeat2, ShieldAlert } from "lucide-react"
import type { SearchResultItem } from "@/lib/api/types"
import {
  platformBadge,
  sentimentBadgeClass,
  sentimentBadgeLabel,
} from "@/lib/api/sentiment"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { INTENSITY_COLORS } from "@/components/analysis/RiskAnalysisPanel"
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis"
import { RiskProfileCard, RiskProfileCardSkeleton } from "@/components/search/RiskProfileCard"

const CONTENT_ICONS: Record<string, string> = {
  comment: "💬",
  post: "📝",
  reel: "🎬",
  video: "▶️",
  article: "📰",
  image: "🖼️",
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "Just now"
  if (h < 24) return `${h} hours ago`
  return `${Math.floor(h / 24)} days ago`
}

const DEMO_NEWS_URLS = [
  "bloomberg.com/crypto",
  "reuters.com/technology",
  "bbc.com/news/technology",
  "cnn.com/business/tech",
]

function isResultLive(r: SearchResultItem): boolean {
  if (r.is_demo) return false
  const url = (r.source_url || r.url).toLowerCase()
  if (url.includes("/example/")) return false
  if (r.platform === "reddit") {
    return url.includes("reddit.com/r/") && url.includes("/comments/")
  }
  if (r.platform === "youtube") return url.includes("watch?v=")
  if (r.platform === "devto") return url.includes("dev.to/") && !url.includes("/search")
  if (r.platform === "hackernews") {
    return url.includes("ycombinator.com/item") || (!!r.url && !r.url.includes("/search"))
  }
  if (r.platform === "guardian") return url.includes("theguardian.com/")
  if (r.platform === "news") {
    return !DEMO_NEWS_URLS.some((d) => url.includes(d))
  }
  return true
}

type ResultsFeedProps = {
  results: SearchResultItem[]
}

const showDevBadge = import.meta.env.DEV

/** Single result row with its own risk analysis state. */
function ResultItem({ r }: { r: SearchResultItem }) {
  const { state: riskState, analyse, reset } = useRiskAnalysis()
  const [riskOpen, setRiskOpen] = useState(false)

  const plat = platformBadge(r.platform, r.source_label)
  const views = r.engagement.views ?? 0
  const link = r.source_url || r.url
  const headline = r.title?.trim() || r.content.slice(0, 120)
  let sourceLabel = r.source_label || r.publication || ""
  if (!sourceLabel && link) {
    try {
      sourceLabel = new URL(link).hostname.replace("www.", "")
    } catch {
      sourceLabel = link
    }
  }

  function handleAnalyseRisk() {
    if (riskOpen) {
      reset()
      setRiskOpen(false)
      return
    }
    setRiskOpen(true)
    void analyse(r.content)
  }

  return (
    <li className="px-5 py-4">
      <div className="flex gap-3">
        {(r.thumbnail || r.image_url) && (
          <img
            src={r.thumbnail || r.image_url || ""}
            alt={headline}
            className="h-16 w-24 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold",
                  plat.className
                )}
              >
                <span aria-hidden>{plat.icon}</span>
                {plat.label}
              </span>
              {r.content_type && (
                <span className="text-[11px] text-muted-foreground">
                  {CONTENT_ICONS[r.content_type] ?? "📝"} {r.content_type}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{r.author}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(r.posted_at)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {showDevBadge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isResultLive(r)
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isResultLive(r) ? "bg-green-500" : "bg-gray-400"
                    )}
                  />
                  {isResultLive(r) ? "Live" : "Demo"}
                </span>
              )}
              <span
                style={
                  r.sentiment_detail?.label
                    ? {
                        backgroundColor:
                          INTENSITY_COLORS[r.sentiment_detail.label]?.bg ?? undefined,
                        color: INTENSITY_COLORS[r.sentiment_detail.label]?.color ?? undefined,
                      }
                    : undefined
                }
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-medium",
                  !r.sentiment_detail && sentimentBadgeClass(r.sentiment)
                )}
              >
                {r.sentiment_detail?.label ?? sentimentBadgeLabel(r.sentiment)}
              </span>
            </div>
          </div>
          {r.title && (
            <p className="mt-2 text-sm font-semibold text-foreground line-clamp-2">
              {r.title}
            </p>
          )}
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{r.content}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {r.platform === "youtube" && views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Play className="size-3.5" /> {views.toLocaleString()} views
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" /> {r.engagement.likes.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="size-3.5" />{" "}
              {r.engagement.shares.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" />{" "}
              {r.engagement.comments.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <span className="flex max-w-[40%] items-center gap-1.5 truncate text-xs text-muted-foreground">
              <ExternalLink size={11} />
              {sourceLabel}
            </span>
            <div className="flex items-center gap-3">
              {/* Analyse Risk button */}
              <button
                type="button"
                id={`analyse-risk-${r.id}`}
                onClick={handleAnalyseRisk}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  riskOpen
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary"
                )}
                aria-expanded={riskOpen}
                aria-controls={`risk-panel-${r.id}`}
              >
                {riskState.loading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ShieldAlert className="size-3" />
                )}
                {riskOpen ? (riskState.loading ? "Analysing…" : "Hide Risk") : "Analyse Risk"}
              </button>
              <a
                href={r.source_url || r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
              >
                Visit source <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Inline risk panel */}
          {riskOpen && (
            <div id={`risk-panel-${r.id}`} className="mt-3">
              {riskState.loading && <RiskProfileCardSkeleton />}
              {riskState.error && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  {riskState.error}
                </p>
              )}
              {riskState.data && !riskState.loading && (
                <RiskProfileCard profile={riskState.data} />
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export function ResultsFeed({ results }: ResultsFeedProps) {
  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No posts in this view.</p>
    )
  }

  return (
    <ul className={cn(proCard, "divide-y divide-border")}>
      {results.map((r) => (
        <ResultItem key={r.id} r={r} />
      ))}
    </ul>
  )
}
