import { useEffect, useRef } from "react"
import type { ChatMessage as ChatMessageType } from "@/api/chat"
import { ChatMessage } from "@/components/chat/ChatMessage"
import { LoadingState } from "@/components/ui/LoadingState"
import { panelSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ChatWindowProps = {
  messages: ChatMessageType[]
  loading?: boolean
}

export function ChatWindow({ messages, loading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  return (
    <div
      className={cn(
        panelSurface,
        "flex min-h-[320px] max-h-[min(60vh,520px)] flex-col overflow-hidden"
      )}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading && (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Ask a question about public opinion for this project.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Answers use your collected mentions and VADER sentiment analysis.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="py-4">
            <LoadingState label="Thinking…" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
