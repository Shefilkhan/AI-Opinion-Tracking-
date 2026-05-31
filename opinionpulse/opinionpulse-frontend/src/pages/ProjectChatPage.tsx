import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Bot, Sparkles } from "lucide-react"
import {
  askProjectChat,
  getChatSession,
  getProjectChatSessions,
  type ChatMessage,
} from "@/api/chat"
import { getProject } from "@/api/projects"
import { ApiError } from "@/api/client"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatSessionList } from "@/components/chat/ChatSessionList"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/LoadingState"
import { cardSurface } from "@/lib/ui-classes"

export function ProjectChatPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ["chat-sessions", projectId],
    queryFn: () => getProjectChatSessions(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => getChatSession(sessionId!),
    enabled: sessionId != null,
  })

  useEffect(() => {
    if (sessionData?.messages) {
      setMessages(sessionData.messages)
    }
  }, [sessionData])

  const askMutation = useMutation({
    mutationFn: (question: string) =>
      askProjectChat(projectId, {
        question,
        session_id: sessionId,
      }),
    onSuccess: async (res) => {
      setSessionId(res.session_id)
      setInput("")
      setError(null)
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] })
      const session = await getChatSession(res.session_id)
      setMessages(session.messages)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to get an answer")
    },
  })

  function sendQuestion(question: string) {
    const q = question.trim()
    if (!q || askMutation.isPending) return

    const tempUser: ChatMessage = {
      id: -Date.now(),
      session_id: sessionId ?? 0,
      role: "user",
      content: q,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUser])
    askMutation.mutate(q)
  }

  if (Number.isNaN(projectId)) {
    return (
      <DashboardLayout title="Invalid project">
        <p className="text-slate-400">Invalid project ID.</p>
      </DashboardLayout>
    )
  }

  if (projectLoading) {
    return (
      <DashboardLayout title="Loading…">
        <LoadingState label="Loading project…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="AI Opinion Assistant"
      subtitle={project ? project.name : "Project chat"}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button render={<Link to={`/projects/${projectId}`} />} variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="size-4" />
          Back to project
        </Button>
        <span className="flex items-center gap-2 text-sm text-violet-300">
          <Bot className="size-4" />
          Template-based assistant — no external AI APIs
        </span>
      </div>

      <Card className={`${cardSurface} mb-6 border-violet-500/20`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="size-5 text-violet-400" />
            Suggested questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestedQuestions
            onSelect={sendQuestion}
            disabled={askMutation.isPending}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <ChatWindow
            messages={messages}
            loading={askMutation.isPending || (sessionLoading && sessionId != null)}
          />
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendQuestion(input)}
            disabled={askMutation.isPending}
          />
        </div>

        <aside className="space-y-4">
          <Card className={cardSurface}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Chat history</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatSessionList
                projectId={projectId}
                sessions={sessionsData?.sessions ?? []}
                activeSessionId={sessionId}
                onSelect={(id) => {
                  setSessionId(id)
                  setError(null)
                }}
                onDeleted={() => {
                  setSessionId(null)
                  setMessages([])
                }}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </DashboardLayout>
  )
}
