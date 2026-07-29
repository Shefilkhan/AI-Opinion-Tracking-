import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  MessageCircle,
  PanelLeft,
  Plus,
  Sparkles,
  Trash2,
  X,
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
import { EmptyState } from "@/components/layout/EmptyState"
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
    structured: row.metadata?.structured ?? null,
    responseFormat: row.metadata?.response_format ?? null,
    references: row.metadata?.references ?? [],
  }))
}

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

type ChatHistorySidebarProps = {
  conversations: PulseConversation[]
  activeConvId: string
  searchQuery: string
  loadingList: boolean
  overlay?: boolean
  onSearchChange: (value: string) => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onClose?: () => void
}

function ChatHistorySidebar({
  conversations,
  activeConvId,
  searchQuery,
  loadingList,
  overlay = false,
  onSearchChange,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onClose,
}: ChatHistorySidebarProps) {
  const filtered = conversations.filter((conv) =>
    (conv.first_message || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col bg-[#0d0d0d]">
      <div className="border-b border-[#222] px-3 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#2563eb] text-white">
              <Sparkles size={12} />
            </div>
            <span className="truncate font-serif-display text-sm font-medium text-white">
              Pulse AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNewChat}
              className="flex shrink-0 items-center gap-1 rounded-md bg-[#2563eb] px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus size={12} />
              New
            </button>
            {overlay && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-[#666] hover:bg-[#222] hover:text-white"
                aria-label="Close history"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <input
          type="search"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-2.5 py-1.5 text-sm text-white placeholder:text-[#555] focus:border-[#444] focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {loadingList ? (
          <p className="px-3 py-6 text-center text-sm text-[#666]">Loading...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={MessageCircle}
            title="No conversations yet"
            description="Start by asking Pulse AI anything"
            className="px-3 [&_h3]:text-[#ccc] [&_p]:text-[#666]"
          />
        ) : (
          filtered.map((conv) => {
            const active = activeConvId === conv.conversation_id
            return (
              <div
                key={conv.conversation_id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectConversation(conv.conversation_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSelectConversation(conv.conversation_id)
                }}
                className={cn(
                  "group mx-1.5 flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2.5 transition-colors",
                  active
                    ? "bg-[#1a1a1a] text-white ring-1 ring-[#333]"
                    : "text-[#aaa] hover:bg-[#141414] hover:text-white"
                )}
              >
                <MessageCircle
                  size={13}
                  className={cn("mt-0.5 shrink-0", active ? "text-[#7eb8ff]" : "text-[#555]")}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {conv.first_message || "New conversation"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#666]">
                    {conv.message_count} messages · {formatTimeAgo(conv.started_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conv.conversation_id)
                  }}
                  className="rounded p-1 text-[#555] opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-[#222] px-3 py-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm text-[#666] transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export function ChatPage() {
  const [conversations, setConversations] = useState<PulseConversation[]>([])
  const [activeConvId, setActiveConvId] = useState(generateConversationId)
  const [chatSessionKey, setChatSessionKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [loadedMessages, setLoadedMessages] = useState<ChatMessageItem[] | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

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
    try {
      const res = await getChatConversation(conversationId)
      setLoadedMessages(storedToChatMessages(res.messages))
    } catch {
      setLoadedMessages([])
    }
    setActiveConvId(conversationId)
    setChatSessionKey((k) => k + 1)
    if (focusMode) setHistoryOpen(false)
  }, [focusMode])

  function startNewChat() {
    setActiveConvId(generateConversationId())
    setLoadedMessages(null)
    setChatSessionKey((k) => k + 1)
    if (focusMode) setHistoryOpen(false)
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

  function enterFocusMode() {
    setFocusMode(true)
    setHistoryOpen(false)
  }

  function exitFocusMode() {
    setFocusMode(false)
    setHistoryOpen(false)
  }

  function toggleHistory() {
    setHistoryOpen((open) => !open)
  }

  const showInlineSidebar = !focusMode
  const showOverlaySidebar = focusMode && historyOpen

  const sidebarProps = {
    conversations,
    activeConvId,
    searchQuery,
    loadingList,
    onSearchChange: setSearchQuery,
    onNewChat: startNewChat,
    onSelectConversation: (id: string) => void loadConversation(id),
    onDeleteConversation: (id: string) => void handleDelete(id),
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      {showInlineSidebar && (
        <div className="flex w-52 shrink-0 flex-col border-r border-[#222] lg:w-56">
          <ChatHistorySidebar {...sidebarProps} />
        </div>
      )}

      {showOverlaySidebar && (
        <>
          <button
            type="button"
            aria-label="Close chat history"
            className="absolute inset-0 z-40 bg-black/60"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[#222] shadow-2xl shadow-black/50">
            <ChatHistorySidebar
              {...sidebarProps}
              overlay
              onClose={() => setHistoryOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatWindow
          mode="full"
          conversationId={activeConvId}
          initialMessages={loadedMessages}
          focusMode={focusMode}
          onEnterFocusMode={enterFocusMode}
          onExitFocusMode={exitFocusMode}
          onToggleHistory={toggleHistory}
          historyOpen={historyOpen}
          onConversationChange={(id) => {
            setActiveConvId(id)
            void refreshConversations()
          }}
          key={chatSessionKey}
        />
      </div>
    </div>
  )
}
