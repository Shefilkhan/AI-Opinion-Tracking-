import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowUp,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeft,
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
  const [dataPanel, setDataPanel] = useState<PulseChatDataUsed | null>(null)
  const [referencesOpen, setReferencesOpen] = useState(true)
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

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [input])

  const isEmptyChat = messages.length <= 1 && messages[0]?.id === "welcome"

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
          setReferencesOpen(true)
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
    setReferencesOpen(true)
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
        isResearchLayout ? "bg-[#0a0a0a] text-white pulse-chat-dark" : "bg-background"
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
                isResearchLayout ? "text-[#a3a3a3]" : "text-muted-foreground"
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
          {isResearchLayout && !focusMode && onEnterFocusMode && (
            <button
              type="button"
              onClick={onEnterFocusMode}
              title="Enter focus mode"
              className="hidden items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[#aaa] transition-colors hover:bg-[#222] hover:text-white sm:inline-flex"
            >
              <Maximize2 size={14} />
              Focus
            </button>
          )}
          {isResearchLayout && onToggleHistory && (
            <button
              type="button"
              onClick={onToggleHistory}
              title={historyOpen ? "Hide chat history" : "Show chat history"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs transition-colors md:hidden",
                historyOpen
                  ? "bg-[#222] text-white"
                  : "text-[#aaa] hover:bg-[#222] hover:text-white"
              )}
            >
              <PanelLeft size={14} />
              History
            </button>
          )}
          {isResearchLayout && focusMode && onToggleHistory && (
            <button
              type="button"
              onClick={onToggleHistory}
              title={historyOpen ? "Hide chat history" : "Show chat history"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs transition-colors",
                historyOpen
                  ? "bg-[#222] text-white"
                  : "text-[#aaa] hover:bg-[#222] hover:text-white"
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
              className="rounded-[var(--radius-md)] p-1.5 text-[#aaa] transition-colors hover:bg-[#222] hover:text-white"
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
                ? "text-[#aaa] hover:bg-[#222] hover:text-white"
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
                ? "text-[#aaa] hover:bg-[#222] hover:text-white"
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

      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              "mx-auto w-full px-4 py-5 sm:px-8",
              isResearchLayout
                ? cn("max-w-3xl space-y-5", focusMode && "max-w-4xl")
                : "max-w-3xl space-y-5"
            )}
          >
            {isEmptyChat && isResearchLayout && (
              <div className="chat-empty-hero mb-2 pt-6 text-center sm:pt-10">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#333] bg-[#161616] shadow-lg shadow-black/30">
                  <Sparkles size={24} className="text-[#7eb8ff]" />
                </div>
                <h1 className="font-serif-display text-2xl font-semibold text-white sm:text-3xl">
                  What does the world think?
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#999]">
                  Pulse AI searches live sources across Reddit, news, YouTube, and more — then
                  cites them in every answer.
                </p>
              </div>
            )}
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
          {isResearchLayout && referencesPanel && referencesPanel.references.length > 0 && (
            <button
              type="button"
              onClick={() => setReferencesOpen(true)}
              className="fixed bottom-24 right-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#333] bg-[#161616] px-3 py-2 text-xs font-medium text-white shadow-lg shadow-black/40 lg:hidden"
            >
              <ExternalLink size={12} className="text-[#7eb8ff]" />
              {referencesPanel.references.length} sources
            </button>
          )}
        </div>

        {isResearchLayout && referencesPanel && referencesPanel.references.length > 0 && referencesOpen && (
          <>
            <button
              type="button"
              aria-label="Close references"
              className="absolute inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setReferencesOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 z-40 flex w-full max-w-md flex-col lg:relative lg:z-auto lg:max-w-[420px] lg:shrink-0 xl:max-w-[480px]">
              <ReferencesPanel
                query={referencesPanel.query}
                references={referencesPanel.references}
                dataUsed={referencesPanel.dataUsed}
                highlightId={referencesPanel.highlightId}
                onClose={() => setReferencesOpen(false)}
                onHighlight={(refId) =>
                  setReferencesPanel((prev) => (prev ? { ...prev, highlightId: refId } : prev))
                }
              />
            </div>
          </>
        )}
      </div>

      {isEmptyChat && !isLoading && (
        <div className={cn("px-4 pb-3", isResearchLayout && "bg-[#0a0a0a]")}>
          <div className="mx-auto w-full max-w-3xl">
            <p
              className={cn(
                "mb-2.5 text-center text-xs font-medium uppercase tracking-wide",
                isResearchLayout ? "text-[#666]" : "text-muted-foreground"
              )}
            >
              Try asking
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs transition-all duration-150",
                    isResearchLayout
                      ? "border-[#333] bg-[#161616] text-[#ccc] hover:border-[#7eb8ff]/40 hover:bg-[#1a1a1a] hover:text-white"
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-accent"
                  )}
                >
                  {s.length > 42 ? `${s.slice(0, 42)}…` : s}
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
            <div className="chat-input-shell rounded-2xl border border-[#2a2a2a] bg-[#141414] p-2 shadow-lg shadow-black/40">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEmptyChat ? "Ask about any topic…" : "Ask a follow up…"}
                rows={1}
                maxLength={500}
                className="max-h-32 min-h-10 w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-[#666] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Live sources
                  </span>
                  {input.length > 0 && (
                    <span className="text-[10px] tabular-nums text-[#555]">{input.length}/500</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="flex size-9 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md shadow-blue-500/20 transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
                </button>
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
              "mt-2 text-center text-[11px]",
              isResearchLayout ? "text-[#555]" : "text-muted-foreground"
            )}
          >
            Pulse AI reads live data · Not financial advice
          </p>
        </div>
      </div>
    </div>
  )
}
