import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, Trash2 } from "lucide-react"
import type { ChatSession } from "@/api/chat"
import { deleteChatSession } from "@/api/chat"
import { Button } from "@/components/ui/button"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ChatSessionListProps = {
  projectId: number
  sessions: ChatSession[]
  activeSessionId: number | null
  onSelect: (sessionId: number) => void
  onDeleted: () => void
}

export function ChatSessionList({
  projectId,
  sessions,
  activeSessionId,
  onSelect,
  onDeleted,
}: ChatSessionListProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (sessionId: number) => deleteChatSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] })
      onDeleted()
    },
  })

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No chat history yet. Ask a question to start a session.
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {sessions.map((s) => (
        <li key={s.id}>
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg border transition-colors",
              activeSessionId === s.id
                ? "border-blue-500/40 bg-blue-950/20"
                : "border-transparent hover:border-slate-700/80 hover:bg-slate-900/50",
              cardSurface
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm"
            >
              <MessageSquare className="size-4 shrink-0 text-slate-500" />
              <span className="truncate text-slate-200">
                {s.title || `Session #${s.id}`}
              </span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-slate-500 hover:text-rose-400"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm("Delete this chat session?")) {
                  deleteMutation.mutate(s.id)
                }
              }}
              aria-label="Delete session"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
