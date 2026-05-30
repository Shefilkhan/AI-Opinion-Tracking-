import { ExternalLink, Trash2 } from "lucide-react"
import type { Mention } from "@/api/mentions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SentimentBadge } from "@/components/sentiment/SentimentBadge"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCE_STYLES: Record<string, string> = {
  manual: "bg-violet-500/15 text-violet-300",
  reddit: "bg-orange-500/15 text-orange-300",
  youtube: "bg-red-500/15 text-red-300",
  gdelt: "bg-blue-500/15 text-blue-300",
  hackernews: "bg-amber-500/15 text-amber-300",
}

type MentionCardProps = {
  mention: Mention
  onDelete: (id: number) => void
  deleting?: boolean
}

export function MentionCard({ mention, onDelete, deleting }: MentionCardProps) {
  const date = mention.published_at
    ? new Date(mention.published_at).toLocaleString()
    : new Date(mention.created_at).toLocaleString()

  return (
    <Card
      className={cn(
        cardSurface,
        "bg-slate-950/60 transition-all duration-200 hover:border-slate-700/70"
      )}
    >
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "capitalize",
                SOURCE_STYLES[mention.source] ?? "bg-slate-700 text-slate-300"
              )}
            >
              {mention.source}
            </Badge>
            {mention.author && (
              <span className="text-sm text-slate-400">{mention.author}</span>
            )}
            <SentimentBadge sentiment={mention.sentiment} showDetails />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(mention.id)}
            disabled={deleting}
            aria-label="Delete mention"
          >
            <Trash2 className="size-4 text-rose-400" />
          </Button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{mention.text}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>{date}</span>
          <span>Engagement: {mention.engagement_score}</span>
          {mention.url && (
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              View source
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
