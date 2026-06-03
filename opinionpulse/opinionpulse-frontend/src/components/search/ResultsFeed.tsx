import { ExternalLink, Heart, MessageCircle, Repeat2 } from "lucide-react"
import type { SearchResultItem } from "@/lib/api/types"
import { platformDisplayName, sentimentLabelColor } from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "Just now"
  if (h < 24) return `${h} hours ago`
  return `${Math.floor(h / 24)} days ago`
}

type ResultsFeedProps = {
  results: SearchResultItem[]
}

export function ResultsFeed({ results }: ResultsFeedProps) {
  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No posts in this view.</p>
    )
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
      {results.map((r) => (
        <li key={r.id}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {platformDisplayName(r.platform)}
                </span>
                <span>·</span>
                <span>{r.author}</span>
                <span>·</span>
                <span>{timeAgo(r.posted_at)}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-gray-700">{r.content}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3.5" /> {r.engagement.likes.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="size-3.5" /> {r.engagement.shares.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="size-3.5" />{" "}
                  {r.engagement.comments.toLocaleString()}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                sentimentLabelColor(r.sentiment)
              )}
            >
              {r.sentiment}
            </span>
            <ExternalLink className="size-4 shrink-0 self-center text-muted-foreground" />
          </a>
        </li>
      ))}
    </ul>
  )
}
