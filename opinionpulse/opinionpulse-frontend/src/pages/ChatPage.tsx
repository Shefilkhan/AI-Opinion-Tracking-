import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MessageCircle } from "lucide-react"
import {
  deleteChatConversation,
  getChatConversation,
  listChatConversations,
  type PulseConversation,
  type PulseStoredMessage,
} from "@/api/chat"
import { ChatMain, generateConversationId } from "@/components/chat/ChatMain"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import type { ChatMessageItem } from "@/components/chat/types"
import { useAuth } from "@/contexts/AuthContext"
import { useUsage } from "@/hooks/useUsage"
import { getUserInitials } from "@/lib/chat-message-utils"

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
    citedSources: row.metadata?.cited_sources ?? [],
    sourcesFetched: row.metadata?.sources_fetched,
  }))
}

export function ChatPage() {
  const { user } = useAuth()
  const { usage, loading: usageLoading } = useUsage()
  const pulseAiEnabled = usage?.features?.pulse_ai ?? false
  const [conversations, setConversations] = useState<PulseConversation[]>([])
  const [activeConvId, setActiveConvId] = useState(generateConversationId)
  const [chatSessionKey, setChatSessionKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [loadedMessages, setLoadedMessages] = useState<ChatMessageItem[] | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    if (!pulseAiEnabled) {
      setLoadingList(false)
      return
    }
    void refreshConversations()
  }, [refreshConversations, pulseAiEnabled])

  if (!usageLoading && usage && !pulseAiEnabled) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[var(--chat-bg)] px-6 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--chat-accent-soft,var(--primary)/0.1)]">
          <MessageCircle className="size-8 text-primary" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--chat-text,var(--foreground))]">
          Pulse AI is a Pro feature
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--chat-text-muted,var(--muted-foreground))]">
          Ask questions, explore sentiment, and get research briefs powered by live platform
          data. Upgrade to Pro to unlock Pulse AI.
        </p>
        <Link
          to="/pricing"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground no-underline shadow-sm transition-colors hover:bg-primary/90"
        >
          Unlock with Pro
        </Link>
      </div>
    )
  }

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const res = await getChatConversation(conversationId)
      setLoadedMessages(storedToChatMessages(res.messages))
    } catch {
      setLoadedMessages([])
    }
    setActiveConvId(conversationId)
    setChatSessionKey((k) => k + 1)
    setSidebarOpen(false)
  }, [])

  function startNewChat() {
    setActiveConvId(generateConversationId())
    setLoadedMessages(null)
    setChatSessionKey((k) => k + 1)
    setSidebarOpen(false)
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

  const userName = user?.full_name || user?.name || "User"
  const userInitials = getUserInitials(userName)
  const planName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Member"

  const sidebarProps = {
    conversations,
    activeId: activeConvId,
    searchQuery,
    loadingList,
    userName,
    userInitials,
    planName,
    onSearchChange: setSearchQuery,
    onNewChat: startNewChat,
    onSelectConversation: (id: string) => void loadConversation(id),
    onDeleteConversation: (id: string) => void handleDelete(id),
  }

  return (
    <div className="chat-page grid h-screen overflow-hidden bg-[var(--chat-bg)] [grid-template-columns:260px_1fr] max-md:[grid-template-columns:1fr]">
      {/* Desktop sidebar */}
      <div className="hidden h-full min-h-0 border-r border-[var(--chat-border)] md:block">
        <ChatSidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] md:hidden">
            <ChatSidebar {...sidebarProps} overlay onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <ChatMain
        key={chatSessionKey}
        conversationId={activeConvId}
        initialMessages={loadedMessages}
        onConversationChange={(id) => {
          setActiveConvId(id)
          void refreshConversations()
        }}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />
    </div>
  )
}
