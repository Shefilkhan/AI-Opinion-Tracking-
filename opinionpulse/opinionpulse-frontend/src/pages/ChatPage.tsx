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
import { EmptyState } from "@/components/layout/EmptyState"
import {
  btnPrimary,
  inputSurface,
  navItemActive,
  navItemInactive,
  pageShell,
} from "@/lib/ui-classes"
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
    <div className={cn("flex h-screen w-full overflow-hidden", pageShell)}>
      <div className="flex w-52 shrink-0 flex-col border-r border-border bg-card lg:w-56">
        <div className="border-b border-border px-3 py-3">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
                <Sparkles size={12} />
              </div>
              <span className="truncate font-serif-display text-sm font-medium text-foreground">
                Pulse AI
              </span>
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className={cn(
                "flex shrink-0 items-center gap-1 px-2 py-1.5 text-xs font-medium",
                btnPrimary
              )}
            >
              <Plus size={12} />
              New
            </button>
          </div>
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(inputSurface, "w-full px-2.5 py-1.5 text-sm")}
          />
        </div>

        <div className="flex-1 overflow-y-auto py-1.5">
          {loadingList ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              icon={MessageCircle}
              title="No conversations yet"
              description="Start by asking Pulse AI anything"
              className="px-3"
            />
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
                  "group mx-1.5 flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] px-2.5 py-2.5 transition-colors",
                  activeConvId === conv.conversation_id
                    ? navItemActive
                    : navItemInactive
                )}
              >
                <MessageCircle
                  size={13}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {conv.first_message || "New conversation"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
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
                  className="rounded p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-3 py-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
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
  )
}
