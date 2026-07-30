import { Link } from "react-router-dom"
import { MessageCircle, Plus, Search, Trash2, X, Zap } from "lucide-react"
import type { PulseConversation } from "@/api/chat"
import { EmptyState } from "@/components/layout/EmptyState"
import { formatTimeAgo } from "@/lib/chat-message-utils"

type ChatSidebarProps = {
  conversations: PulseConversation[]
  activeId: string
  searchQuery: string
  loadingList: boolean
  userName: string
  userInitials: string
  planName: string
  overlay?: boolean
  onSearchChange: (value: string) => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onClose?: () => void
}

export function ChatSidebar({
  conversations,
  activeId,
  searchQuery,
  loadingList,
  userName,
  userInitials,
  planName,
  overlay = false,
  onSearchChange,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onClose,
}: ChatSidebarProps) {
  const filtered = conversations.filter((conv) =>
    (conv.first_message || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="chat-sidebar flex h-full flex-col overflow-hidden bg-[var(--chat-surface)]">
      <div className="border-b border-[var(--chat-border)] px-4 pb-3 pt-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg border border-[rgba(139,92,246,0.30)] bg-[var(--chat-purple-dim)]">
              <Zap size={14} className="text-[var(--chat-purple)]" />
            </div>
            <span className="chat-serif text-[15px] font-bold italic text-[var(--chat-text)]">
              Pulse AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center gap-1.5 rounded-lg border-none bg-[var(--chat-purple)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={13} />
              New
            </button>
            {overlay && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--chat-text-muted)] hover:bg-[var(--chat-surface-2)] hover:text-[var(--chat-text)]"
                aria-label="Close sidebar"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--chat-border)] bg-[var(--chat-surface-2)] px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--chat-text-muted)]" />
          <input
            type="search"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 border-none bg-transparent text-[13px] text-[var(--chat-text)] outline-none placeholder:text-[var(--chat-text-muted)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loadingList ? (
          <p className="py-8 text-center text-sm text-[var(--chat-text-muted)]">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={MessageCircle}
            title="No conversations yet"
            description="Start by asking Pulse AI anything"
            className="px-2 [&_h3]:text-[var(--chat-text-mid)] [&_p]:text-[var(--chat-text-muted)]"
          />
        ) : (
          filtered.map((conv) => {
            const active = activeId === conv.conversation_id
            return (
              <div key={conv.conversation_id} className="group relative mb-0.5">
                <button
                  type="button"
                  onClick={() => onSelectConversation(conv.conversation_id)}
                  className={`chat-conv-item w-full rounded-[10px] border-none px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-[var(--chat-purple-dim)]"
                      : "bg-transparent hover:bg-[var(--chat-surface-2)]"
                  }`}
                >
                  <p
                    className={`m-0 mb-0.5 truncate text-[13px] font-medium ${
                      active ? "text-[var(--chat-purple)]" : "text-[var(--chat-text)]"
                    }`}
                  >
                    {conv.first_message || "New conversation"}
                  </p>
                  <p className="chat-mono m-0 text-[11px] text-[var(--chat-text-muted)]">
                    {conv.message_count} messages · {formatTimeAgo(new Date(conv.started_at))}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conv.conversation_id)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--chat-text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--chat-red)]"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-2.5 border-t border-[var(--chat-border)] px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--chat-purple)] text-[13px] font-bold text-white">
          {userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[13px] font-semibold text-[var(--chat-text)]">{userName}</p>
          <p className="chat-mono m-0 text-[11px] text-[var(--chat-text-muted)]">{planName}</p>
        </div>
        <Link
          to="/dashboard"
          className="chat-mono shrink-0 text-[11px] tracking-wide text-[var(--chat-text-muted)] no-underline hover:text-[var(--chat-text)]"
        >
          ← Dashboard
        </Link>
      </div>
    </aside>
  )
}
