import { ExternalLink } from "lucide-react"
import type { SupportingMention } from "@/api/chat"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SENTIMENT_STYLES, SOURCE_STYLES } from "@/lib/badge-styles"
import { cn } from "@/lib/utils"

type SupportingMentionsProps = {
  mentions: SupportingMention[]
}

export function SupportingMentions({ mentions }: SupportingMentionsProps) {
  if (!mentions.length) return null

  return (
    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
      <p className="text-xs font-medium text-muted-foreground">Supporting mentions</p>
      <ul className="space-y-2">
        {mentions.map((m) => (
          <li
            key={m.id}
            className="rounded-lg border border-gray-200 bg-card p-3 text-sm shadow-[var(--shadow-subtle)]"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "capitalize",
                  SOURCE_STYLES[m.source] ?? "bg-muted text-muted-foreground"
                )}
              >
                {m.source}
              </Badge>
              {m.sentiment_label && (
                <Badge
                  className={cn(
                    "capitalize",
                    SENTIMENT_STYLES[m.sentiment_label] ??
                      "border border-gray-200 bg-muted text-muted-foreground"
                  )}
                >
                  {m.sentiment_label}
                </Badge>
              )}
            </div>
            <p className="line-clamp-3 text-sm text-foreground">{m.text}</p>
            {m.url && (
              <Button
                render={<a href={m.url} target="_blank" rel="noopener noreferrer" />}
                variant="link"
                size="sm"
                className="mt-2 h-auto gap-1 p-0 text-primary"
              >
                <ExternalLink className="size-3" />
                View source
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
