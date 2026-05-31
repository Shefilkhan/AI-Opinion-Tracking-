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
          <div className="rounded-2xl rounded-br-md bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm text-white shadow-md shadow-blue-900/30">
            {message.content}
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-300">
            <User className="size-4" />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[90%] items-start gap-2 md:max-w-[85%]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300">
          <Bot className="size-4" />
        </span>
        <Card className={cn(cardSurface, "flex-1 border-slate-800/80")}>
          <CardContent className="pt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {message.intent && (
                <Badge variant="outline" className="border-violet-500/30 text-violet-300">
                  {INTENT_LABELS[message.intent] ?? message.intent}
                </Badge>
              )}
              {message.sources_used && message.sources_used.length > 0 && (
                <span className="text-xs text-slate-500">
                  Sources: {message.sources_used.join(", ")}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {message.content}
            </p>
            {message.sentiment && (
              <p className="mt-2 text-xs text-slate-500">
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
