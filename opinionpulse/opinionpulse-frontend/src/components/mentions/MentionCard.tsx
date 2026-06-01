import { ExternalLink, Trash2 } from "lucide-react"
import type { Mention } from "@/api/mentions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SentimentBadge } from "@/components/sentiment/SentimentBadge"
import { SOURCE_STYLES } from "@/lib/badge-styles"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

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
        "transition-all duration-200 hover:border-gray-300"
      )}
    >
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "capitalize",
                SOURCE_STYLES[mention.source] ?? "bg-muted text-foreground/80"
              )}
            >
              {mention.source}
            </Badge>
            {mention.author && (
              <span className="text-sm text-muted-foreground">{mention.author}</span>
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
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground">{mention.text}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{date}</span>
          <span>Engagement: {mention.engagement_score}</span>
          {mention.url && (
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:text-primary"
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
