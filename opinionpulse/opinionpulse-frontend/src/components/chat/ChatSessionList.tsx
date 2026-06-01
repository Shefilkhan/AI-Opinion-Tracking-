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
      <p className="text-sm text-muted-foreground">
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
                ? "border-primary/30 bg-muted"
                : "border-transparent hover:border-gray-200 hover:bg-card",
              cardSurface
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm"
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground">
                {s.title || `Session #${s.id}`}
              </span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
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
