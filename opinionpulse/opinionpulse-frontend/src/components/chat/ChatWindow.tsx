import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowUp,
  ExternalLink,
  Filter,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeft,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import {
  getChatExportUrl,
  sendChatMessage,
  type PulseChatDataUsed,
  type PulseChatReference,
} from "@/api/chat"
import { ApiError } from "@/api/client"
import { MessageBubble, type ChatMessageItem } from "@/components/chat/MessageBubble"
import { ReferencesPanel } from "@/components/chat/ReferencesPanel"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const STARTER_SUGGESTIONS = [
  "Tell me about Bitcoin",
  "What do people think about Artificial Intelligence?",
  "Show me climate change sentiment right now",
  "What's trending on Reddit today?",
  "Compare opinions on electric vehicles",
]

const WELCOME_MESSAGE: ChatMessageItem = {
  id: "welcome",
  role: "assistant",
  content: `Ask anything — Pulse AI searches live sources and cites them in the answer.

Try: **"Tell me about Bitcoin"** or **"What do people think about AI?"**`,
  timestamp: new Date(),
  suggestions: STARTER_SUGGESTIONS.slice(0, 3),
}

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

type ChatWindowProps = {
  mode?: "bubble" | "full"
  onClose?: () => void
  onExpand?: () => void
  conversationId?: string | null
  onConversationChange?: (id: string) => void
  initialMessages?: ChatMessageItem[] | null
  focusMode?: boolean
  onEnterFocusMode?: () => void
  onExitFocusMode?: () => void
  onToggleHistory?: () => void
  historyOpen?: boolean
}

export function ChatWindow({
  mode = "bubble",
  onClose,
  onExpand,
  conversationId: initialConvId = null,
  onConversationChange,
  initialMessages = null,
  focusMode = false,
  onEnterFocusMode,
  onExitFocusMode,
  onToggleHistory,
  historyOpen = false,
}: ChatWindowProps) {
  const isResearchLayout = mode === "full"
  const [messages, setMessages] = useState<ChatMessageItem[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(
    initialConvId || generateConversationId()
  )
  const [sourcesCount, setSourcesCount] = useState<number | null>(null)
  const [referencesPanel, setReferencesPanel] = useState<{
    query: string
    references: PulseChatReference[]
    dataUsed?: PulseChatDataUsed | null
    highlightId?: number | null
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialConvId) setConversationId(initialConvId)
  }, [initialConvId])

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
      const lastWithRefs = [...initialMessages]
        .reverse()
        .find((m) => m.role === "assistant" && (m.references?.length ?? 0) > 0)
      if (lastWithRefs?.references?.length) {
        setReferencesPanel({
          query: lastWithRefs.dataUsed?.query || "",
          references: lastWithRefs.references,
          dataUsed: lastWithRefs.dataUsed,
          highlightId: null,
        })
      }
    }
  }, [initialMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = useCallback(
    async (text = input) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMessage: ChatMessageItem = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const data = await sendChatMessage(trimmed, conversationId)

        if (data.conversation_id) {
          setConversationId(data.conversation_id)
          onConversationChange?.(data.conversation_id)
        }

        const aiMessage: ChatMessageItem = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || "I couldn't process that request.",
          timestamp: new Date(),
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          dataUsed: data.data_used,
          hasRealData: data.has_real_data,
          structured: data.structured ?? null,
          responseFormat: data.response_format ?? null,
          references: data.references ?? [],
          citedSources: data.cited_sources ?? [],
          sourcesFetched: data.sources_fetched ?? data.data_used?.results_count ?? 0,
        }

        setMessages((prev) => [...prev, aiMessage])

        if (data.references?.length) {
          setReferencesPanel({
            query: data.data_used?.query || trimmed,
            references: data.references,
            dataUsed: data.data_used,
            highlightId: null,
          })
        }

        if (data.has_real_data && data.data_used) {
          setDataPanel(data.data_used)
        }
        if (data.sources_fetched || data.data_used?.results_count) {
          setSourcesCount(data.sources_fetched ?? data.data_used?.results_count ?? null)
        }
      } catch (err) {
        const detail =
          err instanceof ApiError
            ? err.detail
            : "Sorry, I couldn't process that request. Please try again."
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: detail,
            timestamp: new Date(),
            isError: true,
          },
        ])
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    [conversationId, input, isLoading, onConversationChange]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  function clearChat() {
    const newId = generateConversationId()
    setMessages([WELCOME_MESSAGE])
    setConversationId(newId)
    onConversationChange?.(newId)
    setDataPanel(null)
    setReferencesPanel(null)
    setSourcesCount(null)
  }

  function handleCitationClick(refId: number) {
    setReferencesPanel((prev) => (prev ? { ...prev, highlightId: refId } : null))
    setTimeout(() => {
      document.getElementById(`ref-${refId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }, 50)
  }

  function exportChat() {
    window.open(getChatExportUrl(conversationId), "_blank")
  }

  const activeQuery =
    referencesPanel?.query ||
    [...messages].reverse().find((m) => m.role === "user")?.content ||
    ""

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isResearchLayout ? "bg-[#0a0a0a] text-white" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-3",
          isResearchLayout
            ? "border-[#222] bg-[#0d0d0d]"
            : "border-border bg-card"
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full border",
              isResearchLayout
                ? "border-[#333] bg-[#1a1a1a]"
                : "border-border bg-accent"
            )}
          >
            <Sparkles
              size={16}
              className={isResearchLayout ? "text-[#7eb8ff]" : "text-accent-foreground"}
            />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-medium",
                isResearchLayout ? "text-white" : "text-foreground"
              )}
            >
              {isResearchLayout && activeQuery ? activeQuery : "Pulse AI"}
            </p>
            <p
              className={cn(
                "text-xs",
                isResearchLayout ? "text-[#666]" : "text-muted-foreground"
              )}
            >
              {sourcesCount ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] uppercase tracking-wide">
                    Analyzed {sourcesCount} live posts before answering
                  </span>
                </span>
              ) : (
                "Live sources · cited answers"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isResearchLayout && focusMode && onToggleHistory && (
            <button
              type="button"
              onClick={onToggleHistory}
              title={historyOpen ? "Hide chat history" : "Show chat history"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs transition-colors",
                historyOpen
                  ? "bg-[#222] text-white"
                  : "text-[#666] hover:bg-[#222] hover:text-white"
              )}
            >
              <PanelLeft size={14} />
              History
            </button>
          )}
          {isResearchLayout && focusMode && onExitFocusMode && (
            <button
              type="button"
              onClick={onExitFocusMode}
              title="Exit full screen"
              className="rounded-[var(--radius-md)] p-1.5 text-[#666] transition-colors hover:bg-[#222] hover:text-white"
            >
              <Minimize2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={clearChat}
            title="New conversation"
            className={cn(
              "rounded-[var(--radius-md)] p-1.5 transition-colors",
              isResearchLayout
                ? "text-[#666] hover:bg-[#222] hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={exportChat}
            title="Export chat"
            className={cn(
              "rounded-[var(--radius-md)] p-1.5 transition-colors",
              isResearchLayout
                ? "text-[#666] hover:bg-[#222] hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ExternalLink size={14} />
          </button>
          {mode === "bubble" && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              title="Open full page"
              className="rounded-[var(--radius-md)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Maximize2 size={14} />
            </button>
          )}
          {mode === "bubble" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-md)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!isResearchLayout && dataPanel && (
        <div className="flex items-center justify-between border-b border-border bg-accent px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-accent-foreground">
            Analyzed {dataPanel.results_count} posts from{" "}
            {dataPanel.platforms?.join(", ") || "live sources"}
          </div>
          <button type="button" onClick={() => setDataPanel(null)} className="text-muted-foreground">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              "mx-auto w-full px-4 py-5 sm:px-8",
              isResearchLayout
                ? focusMode
                  ? "max-w-4xl space-y-5"
                  : "max-w-3xl"
                : "max-w-3xl space-y-5"
            )}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSuggestionClick={(s) => void sendMessage(s)}
                onCitationClick={handleCitationClick}
                showInlineReferences={mode === "bubble"}
                variant={isResearchLayout ? "research" : "bubble"}
              />
            ))}
            {isLoading && (
              <div className={isResearchLayout ? "py-4" : ""}>
                <TypingIndicator dark={isResearchLayout} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {isResearchLayout && referencesPanel && referencesPanel.references.length > 0 && (
          <ReferencesPanel
            query={referencesPanel.query}
            references={referencesPanel.references}
            dataUsed={referencesPanel.dataUsed}
            highlightId={referencesPanel.highlightId}
            onHighlight={(refId) =>
              setReferencesPanel((prev) => (prev ? { ...prev, highlightId: refId } : prev))
            }
          />
        )}
      </div>

      {messages.length <= 1 && !isLoading && (
        <div className={cn("px-4 pb-3", isResearchLayout && "bg-[#0a0a0a]")}>
          <div className="mx-auto w-full max-w-3xl">
            <p
              className={cn(
                "mb-2 text-xs font-medium",
                isResearchLayout ? "text-[#666]" : "text-muted-foreground"
              )}
            >
              Try asking:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  className={cn(
                    "rounded-full border px-2.5 py-1.5 text-xs transition-colors",
                    isResearchLayout
                      ? "border-[#333] bg-[#161616] text-[#ccc] hover:border-[#555] hover:text-white"
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-accent"
                  )}
                >
                  {s.length > 40 ? `${s.slice(0, 40)}...` : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "sticky bottom-0 z-10 border-t px-4 py-3 sm:px-6",
          isResearchLayout ? "border-[#222] bg-[#0a0a0a]" : "border-border bg-background"
        )}
      >
        <div
          className={cn(
            "mx-auto w-full",
            isResearchLayout ? "max-w-3xl" : "max-w-3xl"
          )}
        >
          {isResearchLayout ? (
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-2 shadow-lg shadow-black/40">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow up..."
                rows={1}
                maxLength={500}
                className="max-h-32 min-h-10 w-full resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2 px-1 pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[#666] hover:bg-[#222] hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1.5 text-xs text-[#888] hover:bg-[#222] hover:text-white"
                  >
                    Live sources
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#888] hover:bg-[#222] hover:text-white"
                  >
                    <Sparkles size={12} />
                    Deep
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#888] hover:bg-[#222] hover:text-white"
                  >
                    <Filter size={12} />
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="flex size-9 items-center justify-center rounded-full bg-[#2563eb] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowUp size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any topic... (Enter to send)"
                  rows={1}
                  maxLength={500}
                  className={cn(
                    inputSurface,
                    "max-h-32 min-h-12 w-full resize-none overflow-y-auto px-4 py-3 pr-12"
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center",
                  btnPrimary,
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin text-primary-foreground" />
                ) : (
                  <Send size={16} className="text-primary-foreground" />
                )}
              </button>
            </div>
          )}

          <p
            className={cn(
              "mt-2 text-center text-xs",
              isResearchLayout ? "text-[#555]" : "text-muted-foreground"
            )}
          >
            Pulse AI reads live data · Not financial advice
          </p>
          {mode === "full" && !focusMode && onEnterFocusMode && (
            <button
              type="button"
              onClick={onEnterFocusMode}
              className={cn(
                "mt-2 w-full text-center text-xs hover:underline",
                isResearchLayout ? "text-[#7eb8ff]" : "text-primary"
              )}
            >
              Open full screen →
            </button>
          )}
          {mode === "full" && focusMode && (
            <p className="mt-2 text-center text-[11px] text-[#555]">
              Full screen · Use <span className="text-[#888]">History</span> in the header to
              open past chats
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
