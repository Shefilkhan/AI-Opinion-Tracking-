import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import {
  deleteChatConversation,
  getChatConversation,
  listChatConversations,
  type PulseConversation,
  type PulseStoredMessage,
} from "@/api/chat"
import { ChatWindow } from "@/components/chat/ChatWindow"
import type { ChatMessageItem } from "@/components/chat/MessageBubble"
import { ParticleBackground } from "@/components/ui/ParticleBackground"
import { cn } from "@/lib/utils"

function formatTimeAgo(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function storedToChatMessages(rows: PulseStoredMessage[]): ChatMessageItem[] {
  return rows.map((row, i) => ({
    id: `${row.created_at}-${i}`,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
    suggestions: Array.isArray(row.metadata?.suggestions)
      ? row.metadata.suggestions
      : [],
    hasRealData: row.metadata?.has_real_data,
    dataUsed: row.metadata?.data_used,
  }))
}

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function ChatPage() {
  const [conversations, setConversations] = useState<PulseConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loadedMessages, setLoadedMessages] = useState<ChatMessageItem[] | null>(
    null
  )
  const [loadingList, setLoadingList] = useState(true)

  const refreshConversations = useCallback(async () => {
    try {
      const res = await listChatConversations()
      setConversations(res.conversations)
    } catch {
      setConversations([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  const loadConversation = useCallback(async (conversationId: string) => {
    setActiveConvId(conversationId)
    try {
      const res = await getChatConversation(conversationId)
      setLoadedMessages(storedToChatMessages(res.messages))
    } catch {
      setLoadedMessages([])
    }
  }, [])

  function startNewChat() {
    const id = generateConversationId()
    setActiveConvId(id)
    setLoadedMessages(null)
  }

  async function handleDelete(conversationId: string) {
    try {
      await deleteChatConversation(conversationId)
      if (activeConvId === conversationId) {
        startNewChat()
      }
      void refreshConversations()
    } catch {
      /* ignore */
    }
  }

  const filtered = conversations.filter((conv) =>
    (conv.first_message || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-[#0f0f1a]">
      <div className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#13131f] lg:w-72 xl:w-80">
        <div className="border-b border-gray-100 p-4 dark:border-[#2d2d44]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Pulse AI
              </span>
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500"
            >
              <Plus size={12} />
              New Chat
            </button>
          </div>
          <input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none dark:border-[#2d2d44] dark:bg-[#252538] dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loadingList ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No conversations yet</p>
              <p className="mt-1 text-xs text-gray-300">
                Start by asking Pulse AI anything
              </p>
            </div>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.conversation_id}
                role="button"
                tabIndex={0}
                onClick={() => void loadConversation(conv.conversation_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadConversation(conv.conversation_id)
                }}
                className={cn(
                  "group mx-2 flex cursor-pointer items-start gap-2 rounded-xl px-3 py-3 transition-colors",
                  activeConvId === conv.conversation_id
                    ? "border border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                )}
              >
                <MessageCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-gray-400"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                    {conv.first_message || "New conversation"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {conv.message_count} messages ·{" "}
                    {formatTimeAgo(conv.started_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleDelete(conv.conversation_id)
                  }}
                  className="rounded p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 p-4 dark:border-[#2d2d44]">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <ParticleBackground sentiment="neutral" intensity={0.2} />
        <div className="relative z-10 flex h-full w-full flex-1 flex-col p-4 sm:p-5 lg:p-6 xl:p-8">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md dark:border-[#2d2d44] dark:bg-[#1e1e30] dark:shadow-black/40 xl:max-w-none">
            <ChatWindow
              mode="full"
              conversationId={activeConvId}
              initialMessages={loadedMessages}
              onConversationChange={(id) => {
                setActiveConvId(id)
                void refreshConversations()
              }}
              key={activeConvId ?? "new"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
