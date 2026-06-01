import { Bot, User } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "@/api/chat"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SupportingMentions } from "@/components/chat/SupportingMentions"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const INTENT_LABELS: Record<string, string> = {
  summary: "Summary",
  complaints: "Complaints",
  positive_points: "Positive",
  comparison: "Comparison",
  trend: "Trend",
  source_specific: "Source",
  top_mentions: "Top mentions",
  unknown: "General",
}

type ChatMessageProps = {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-end gap-2">
          <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {message.content}
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-4" />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[90%] items-start gap-2 md:max-w-[85%]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" />
        </span>
        <Card className={cn(cardSurface, "flex-1")}>
          <CardContent className="pt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {message.intent && (
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {INTENT_LABELS[message.intent] ?? message.intent}
                </Badge>
              )}
              {message.sources_used && message.sources_used.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Sources: {message.sources_used.join(", ")}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.content}
            </p>
            {message.sentiment && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sentiment snapshot — +{message.sentiment.positive} / ~
                {message.sentiment.neutral} / -{message.sentiment.negative}
              </p>
            )}
            {message.supporting_mentions && message.supporting_mentions.length > 0 && (
              <SupportingMentions mentions={message.supporting_mentions} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
