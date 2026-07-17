import { useState } from "react"
import { Copy, Sparkles } from "lucide-react"
import type { PulseChatDataUsed, PulseChatStructured } from "@/api/chat"
import { SuggestionsBar } from "@/components/chat/SuggestionsBar"
import { StructuredChatRenderer } from "@/components/chat/StructuredChatRenderer"
import { cn } from "@/lib/utils"

export type ChatMessageItem = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  dataUsed?: PulseChatDataUsed
  hasRealData?: boolean
  isError?: boolean
  structured?: PulseChatStructured | null
  responseFormat?: string | null
}

type MessageBubbleProps = {
  message: ChatMessageItem
  onSuggestionClick: (text: string) => void
}


function isDatabaseError(content: string): boolean {
  const lower = content.toLowerCase()
  return (
    lower.includes("pymysql") ||
    lower.includes("operationalerror") ||
    lower.includes("sqlalchemy") ||
    lower.includes("[sql:") ||
    lower.includes("unknown column")
  )
}

export function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const showDbError = !isUser && isDatabaseError(message.content)
  const suggestions = message.suggestions ?? []

  function copyMessage() {
    void navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn("group flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-accent text-accent-foreground"
        )}
      >
        {isUser ? (
          "U"
        ) : (
          <Sparkles size={12} className="text-accent-foreground" aria-hidden />
        )}
      </div>

      <div
        className={cn(
          "flex w-full max-w-[85%] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-[var(--radius-sm)] bg-primary text-primary-foreground"
              : message.isError
                ? "rounded-tl-[var(--radius-sm)] border border-destructive/20 bg-destructive/5 text-destructive"
                : "rounded-tl-[var(--radius-sm)] border border-border bg-card text-foreground"
          )}
        >
          {!isUser && message.hasRealData && (
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-primary">
              <span className="inline-block size-1.5 rounded-full bg-success" />
              Based on live data
            </div>
          )}

          {isUser ? (
            <p>{message.content}</p>
          ) : showDbError ? (
            <div>
              <p className="mb-1 font-medium text-destructive">
                Database connection issue
              </p>
              <p className="text-xs text-destructive/80">
                The chat history service encountered an error. Your question was
                received but history could not be saved. Please try again.
              </p>
            </div>
          ) : (
            <StructuredChatRenderer
              content={message.content}
              structured={message.structured}
            />
          )}
        </div>

        {!isUser && (
          <div className="mt-1.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={copyMessage}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Copy size={11} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {!isUser && suggestions.length > 0 && (
          <SuggestionsBar
            suggestions={suggestions}
            onSuggestionClick={onSuggestionClick}
          />
        )}

        <span className="mt-1 text-[10px] text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}
