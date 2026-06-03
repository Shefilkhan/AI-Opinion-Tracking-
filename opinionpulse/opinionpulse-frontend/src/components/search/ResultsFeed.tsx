import { ExternalLink, Heart, MessageCircle, Play, Repeat2 } from "lucide-react"
import type { SearchResultItem } from "@/lib/api/types"
import {
  platformBadge,
  sentimentBadgeClass,
  sentimentBadgeLabel,
} from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

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

export function ResultsFeed({ results }: ResultsFeedProps) {
  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No posts in this view.</p>
    )
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
      {results.map((r) => {
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

        return (
          <li key={r.id} className="px-5 py-4">
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
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        sentimentBadgeClass(r.sentiment)
                      )}
                    >
                      {sentimentBadgeLabel(r.sentiment)}
                    </span>
                  </div>
                </div>
                {r.title && (
                  <p className="mt-2 text-sm font-semibold text-foreground line-clamp-2">
                    {r.title}
                  </p>
                )}
                <p className="mt-1 line-clamp-3 text-sm text-gray-700">{r.content}</p>
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
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="flex max-w-[60%] items-center gap-1.5 truncate text-xs text-gray-400">
                    <ExternalLink size={11} />
                    {sourceLabel}
                  </span>
                  <a
                    href={r.source_url || r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-800 hover:underline"
                  >
                    Visit source <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
