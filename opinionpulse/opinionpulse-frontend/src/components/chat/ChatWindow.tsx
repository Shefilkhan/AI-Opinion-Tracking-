import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart2,
  ExternalLink,
  Loader2,
  Maximize2,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import {
  getChatExportUrl,
  sendChatMessage,
  type PulseChatDataUsed,
} from "@/api/chat"
import { ApiError } from "@/api/client"
import { MessageBubble, type ChatMessageItem } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const STARTER_SUGGESTIONS = [
  "What do people think about Artificial Intelligence?",
  "Show me Bitcoin sentiment right now",
  "What's trending on Reddit today?",
  "Predict where climate change opinion is heading",
  "Compare opinions on electric vehicles",
  "What are people saying about remote work?",
]

const WELCOME_MESSAGE: ChatMessageItem = {
  id: "welcome",
  role: "assistant",
  content: `Hi! I'm **Pulse AI**.

I can analyze real-time public opinion from Reddit, YouTube, NewsAPI, and 7 more sources.

Try asking me:
- "What do people think about Bitcoin?"
- "Predict AI opinion trends"
- "Show me climate change sentiment"`,
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
}

export function ChatWindow({
  mode = "bubble",
  onClose,
  onExpand,
  conversationId: initialConvId = null,
  onConversationChange,
  initialMessages = null,
}: ChatWindowProps) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessageItem[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(
    initialConvId || generateConversationId()
  )
  const [dataPanel, setDataPanel] = useState<PulseChatDataUsed | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialConvId) {
      setConversationId(initialConvId)
    }
  }, [initialConvId])

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
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
        }

        setMessages((prev) => [...prev, aiMessage])

        if (data.has_real_data && data.data_used) {
          setDataPanel(data.data_used)
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
  }

  function exportChat() {
    window.open(getChatExportUrl(conversationId), "_blank")
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full border border-border bg-accent">
            <Sparkles size={16} className="text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Pulse AI</p>
            <p className="text-xs text-muted-foreground">Powered by Groq + Live Data</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            title="New conversation"
            className="rounded-[var(--radius-md)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={exportChat}
            title="Export chat"
            className="rounded-[var(--radius-md)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

      {dataPanel && (
        <div className="flex items-center justify-between border-b border-border bg-accent px-4 py-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-primary" />
            <span className="text-xs text-accent-foreground">
              Analyzed {dataPanel.results_count} real posts from{" "}
              {dataPanel.platforms?.join(", ") || "live sources"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDataPanel(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestionClick={(s) => void sendMessage(s)}
            />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pb-3">
          <div className="mx-auto w-full max-w-3xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  className="rounded-full border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
                >
                  {s.length > 35 ? `${s.slice(0, 35)}...` : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-10 border-t border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
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
              {input.length > 400 && (
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {500 - input.length}
                </span>
              )}
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
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pulse AI reads live data · Not financial advice
          </p>
          {mode === "full" && (
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="mt-2 w-full text-center text-xs text-primary hover:underline"
            >
              Open full search results →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
