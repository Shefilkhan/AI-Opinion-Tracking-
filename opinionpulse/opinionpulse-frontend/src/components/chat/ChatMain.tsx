import { useCallback, useEffect, useRef, useState } from "react"
import { PanelLeft, RefreshCw, Share2, Sparkles } from "lucide-react"
import { getChatExportUrl, sendChatMessage } from "@/api/chat"
import { ApiError } from "@/api/client"
import { AIMessage } from "@/components/chat/AIMessage"
import { AIThinkingIndicator } from "@/components/chat/AIThinkingIndicator"
import { ChatInputBar } from "@/components/chat/ChatInputBar"
import { UserMessage } from "@/components/chat/UserMessage"
import { SuggestionChips } from "@/components/chat/SuggestionChips"
import type { ChatMessageItem } from "@/components/chat/types"

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

Try asking about a trending topic, brand, or public debate.`,
  timestamp: new Date(),
  suggestions: STARTER_SUGGESTIONS.slice(0, 3),
}

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

type ChatMainProps = {
  conversationId: string
  initialMessages?: ChatMessageItem[] | null
  onConversationChange?: (id: string) => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

export function ChatMain({
  conversationId: initialConvId,
  initialMessages = null,
  onConversationChange,
  onToggleSidebar,
}: ChatMainProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(initialConvId)
  const [sourcesCount, setSourcesCount] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConversationId(initialConvId)
  }, [initialConvId])

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    } else if (initialMessages === null) {
      setMessages([WELCOME_MESSAGE])
    }
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMessage: ChatMessageItem = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
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
      }
    },
    [conversationId, isLoading, onConversationChange]
  )

  function clearChat() {
    const newId = generateConversationId()
    setMessages([WELCOME_MESSAGE])
    setSourcesCount(null)
    setConversationId(newId)
    onConversationChange?.(newId)
  }

  function exportChat() {
    window.open(getChatExportUrl(conversationId), "_blank")
  }

  const conversationTitle =
    [...messages].reverse().find((m) => m.role === "user")?.content ||
    "New conversation"

  const isEmptyChat = messages.length <= 1 && messages[0]?.id === "welcome"

  return (
    <main className="flex h-full min-w-0 flex-col overflow-hidden bg-[var(--chat-bg)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--chat-border)] bg-[var(--chat-surface)] px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="chat-icon-btn md:hidden"
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={15} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="chat-serif m-0 max-w-[500px] truncate text-[15px] font-semibold text-[var(--chat-text)]">
              {conversationTitle}
            </h2>
            <p className="chat-mono m-0 flex items-center gap-1.5 text-[11px] text-[var(--chat-text-muted)]">
              <span className="inline-block size-1.5 rounded-full bg-[var(--chat-green)]" />
              {sourcesCount
                ? `Analyzed ${sourcesCount} live posts before answering`
                : "Live sources · cited answers"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={clearChat} title="New conversation" className="chat-icon-btn">
            <RefreshCw size={15} />
          </button>
          <button type="button" onClick={exportChat} title="Export chat" className="chat-icon-btn">
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {isEmptyChat && (
            <div className="chat-empty-hero py-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-surface)]">
                <Sparkles size={24} className="text-[var(--chat-purple)]" />
              </div>
              <h1 className="chat-serif m-0 text-2xl font-semibold text-[var(--chat-text)] sm:text-3xl">
                What does the world think?
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--chat-text-muted)]">
                Pulse AI searches live sources across Reddit, news, YouTube, and more — then cites
                them in every answer.
              </p>
              <div className="mt-6">
                <SuggestionChips
                  suggestions={STARTER_SUGGESTIONS}
                  onSelect={(s) => void sendMessage(s)}
                />
              </div>
            </div>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} content={msg.content} />
            ) : msg.id === "welcome" ? null : (
              <AIMessage
                key={msg.id}
                message={msg}
                onSuggestionClick={(s) => void sendMessage(s)}
              />
            )
          )}

          {isLoading && <AIThinkingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInputBar
        onSend={(text) => void sendMessage(text)}
        isLoading={isLoading}
        placeholder={isEmptyChat ? "Ask about any topic…" : "Ask a follow up…"}
      />
    </main>
  )
}

export { WELCOME_MESSAGE, STARTER_SUGGESTIONS, generateConversationId }
