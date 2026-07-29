import { useState } from "react"
import { Copy, Sparkles } from "lucide-react"
import type {
  PulseChatCitedSource,
  PulseChatDataUsed,
  PulseChatReference,
  PulseChatStructured,
} from "@/api/chat"
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
  references?: PulseChatReference[]
  citedSources?: PulseChatCitedSource[]
  sourcesFetched?: number
}

type MessageBubbleProps = {
  message: ChatMessageItem
  onSuggestionClick: (text: string) => void
  onCitationClick?: (refId: number) => void
  showInlineReferences?: boolean
  variant?: "bubble" | "research"
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

function isResearchMessage(message: ChatMessageItem): boolean {
  return (
    message.structured?.type === "research_brief" &&
    (message.references?.length ?? 0) > 0 &&
    !(message.citedSources?.length ?? 0)
  )
}

function renderWithCitations(content: string, citedSources: PulseChatCitedSource[]) {
  const parts = content.split(/(\[\d+\])/g)
  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (!match) {
      return <span key={`text-${index}`}>{part}</span>
    }
    const num = parseInt(match[1], 10)
    const source = citedSources.find((s) => s.number === num)
    if (!source?.url) {
      return <span key={`cite-${index}`}>{part}</span>
    }
    return (
      <a
        key={`cite-${index}`}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        title={source.title}
        className="mx-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded bg-primary/15 px-1 text-[10px] font-bold text-primary hover:bg-primary/25"
      >
        {num}
      </a>
    )
  })
}

function CitedMessage({
  content,
  citedSources,
  dark = false,
}: {
  content: string
  citedSources: PulseChatCitedSource[]
  dark?: boolean
}) {
  return (
    <div>
      <div
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed",
          dark ? "text-[#ddd]" : "text-foreground"
        )}
      >
        {renderWithCitations(content, citedSources)}
      </div>

      {citedSources.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p
            className={cn(
              "font-mono text-[11px] uppercase tracking-wide",
              dark ? "text-[#9999A6]" : "text-muted-foreground"
            )}
          >
            Sources cited
          </p>
          {citedSources.map((source) => (
            <a
              key={source.number}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 no-underline transition-colors",
                dark
                  ? "border-white/10 bg-white/[0.03] hover:border-white/20"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold",
                  dark ? "bg-violet-500/15 text-violet-300" : "bg-primary/15 text-primary"
                )}
              >
                {source.number}
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px] uppercase",
                  dark ? "text-[#6666AA]" : "text-muted-foreground"
                )}
              >
                {source.platform}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  dark ? "text-white/65" : "text-foreground/80"
                )}
              >
                {source.title}
              </span>
              <span
                className={cn(
                  "ml-auto shrink-0 text-[10px]",
                  dark ? "text-[#444466]" : "text-muted-foreground"
                )}
              >
                ↗
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function MessageBubble({
  message,
  onSuggestionClick,
  onCitationClick,
  showInlineReferences = false,
  variant = "bubble",
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const showDbError = !isUser && isDatabaseError(message.content)
  const suggestions = message.suggestions ?? []
  const researchDoc = variant === "research" && isResearchMessage(message)
  const hasCitedSources = (message.citedSources?.length ?? 0) > 0

  function copyMessage() {
    void navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (variant === "research" && isUser) {
    return (
      <div className="flex justify-end py-2">
        <div className="max-w-[85%] rounded-2xl bg-[#2563eb] px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  if (researchDoc) {
    return (
      <div className="group py-4">
        <StructuredChatRenderer
          content={message.content}
          structured={message.structured}
          references={message.references}
          onCitationClick={onCitationClick}
          showInlineReferences={showInlineReferences}
          dark
        />

        <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={copyMessage}
            className="flex items-center gap-1 text-xs text-[#666] transition-colors hover:text-white"
          >
            <Copy size={11} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4">
            <SuggestionsBar
              suggestions={suggestions}
              onSuggestionClick={onSuggestionClick}
              dark
            />
          </div>
        )}
      </div>
    )
  }

  if (variant === "research" && !isUser) {
    return (
      <div className="group py-3">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#111] px-4 py-3 text-sm text-[#ddd]">
          {!message.isError && message.hasRealData && (
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[#7eb8ff]">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Based on live data
            </div>
          )}
          {showDbError ? (
            <div>
              <p className="mb-1 font-medium text-red-400">Database connection issue</p>
              <p className="text-xs text-red-300/80">
                The chat history service encountered an error. Please try again.
              </p>
            </div>
          ) : hasCitedSources ? (
            <CitedMessage
              content={message.content}
              citedSources={message.citedSources ?? []}
              dark={variant === "research"}
            />
          ) : (
            <StructuredChatRenderer
              content={message.content}
              structured={message.structured}
              references={message.references}
              onCitationClick={onCitationClick}
              showInlineReferences={showInlineReferences}
              dark
            />
          )}
        </div>

        {!message.isError && suggestions.length > 0 && (
          <div className="mt-3">
            <SuggestionsBar suggestions={suggestions} onSuggestionClick={onSuggestionClick} dark />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("group flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-accent text-accent-foreground"
        )}
      >
        {isUser ? "U" : <Sparkles size={12} className="text-accent-foreground" aria-hidden />}
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
              <p className="mb-1 font-medium text-destructive">Database connection issue</p>
              <p className="text-xs text-destructive/80">
                The chat history service encountered an error. Your question was received but
                history could not be saved. Please try again.
              </p>
            </div>
          ) : hasCitedSources ? (
            <CitedMessage
              content={message.content}
              citedSources={message.citedSources ?? []}
              dark={variant === "research"}
            />
          ) : (
            <StructuredChatRenderer
              content={message.content}
              structured={message.structured}
              references={message.references}
              onCitationClick={onCitationClick}
              showInlineReferences={showInlineReferences}
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
          <SuggestionsBar suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
        )}

        <span className="mt-1 text-[10px] text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}
