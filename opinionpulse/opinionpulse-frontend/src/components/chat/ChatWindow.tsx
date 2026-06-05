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
  content: `Hi! I'm **Pulse AI** 👋

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
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles size={16} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-white bg-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Pulse AI</p>
            <p className="text-xs text-purple-200">Powered by Groq + Live Data</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            title="New conversation"
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={exportChat}
            title="Export chat"
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink size={14} />
          </button>
          {mode === "bubble" && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              title="Open full page"
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Maximize2 size={14} />
            </button>
          )}
          {mode === "bubble" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {dataPanel && (
        <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50 px-4 py-2 dark:border-purple-500/20 dark:bg-purple-500/10">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-purple-500" />
            <span className="text-xs text-purple-700 dark:text-purple-300">
              Analyzed {dataPanel.results_count} real posts from{" "}
              {dataPanel.platforms?.join(", ") || "live sources"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDataPanel(null)}
            className="text-purple-400 hover:text-purple-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
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

      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pb-3">
          <p className="mb-2 text-xs font-medium text-gray-400">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void sendMessage(s)}
                className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20"
              >
                {s.length > 35 ? `${s.slice(0, 35)}...` : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 px-4 py-3 dark:border-[#2d2d44]">
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
              className="max-h-32 min-h-12 w-full resize-none overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-[#2d2d44] dark:bg-[#252538] dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#2a2a40]"
            />
            {input.length > 400 && (
              <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                {500 - input.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 shadow-md shadow-purple-200 transition-all hover:scale-105 hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-gray-400">
          Pulse AI reads live data · Not financial advice
        </p>
        {mode === "full" && (
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="mt-2 w-full text-center text-xs text-purple-600 hover:underline"
          >
            Open full search results →
          </button>
        )}
      </div>
    </div>
  )
}
