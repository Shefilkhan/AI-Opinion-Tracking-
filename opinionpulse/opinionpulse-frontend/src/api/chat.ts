import { apiRequest } from "@/api/client"

export type ChatSentimentSnapshot = {
  positive: number
  neutral: number
  negative: number
}

export type SupportingMention = {
  id: number
  source: string
  text: string
  sentiment_label: string
  sentiment_score: number
  url?: string | null
  author?: string | null
}

export type ChatAskRequest = {
  question: string
  session_id?: number | null
}

export type ChatAskResponse = {
  session_id: number
  answer: string
  intent: string
  sources_used: string[]
  sentiment: ChatSentimentSnapshot
  supporting_mentions: SupportingMention[]
}

export type ChatMessage = {
  id: number
  session_id: number
  role: "user" | "assistant"
  content: string
  sources_used?: string[] | null
  intent?: string | null
  sentiment?: ChatSentimentSnapshot | null
  supporting_mentions?: SupportingMention[] | null
  created_at: string
}

export type ChatSession = {
  id: number
  user_id: number
  project_id: number | null
  title: string | null
  created_at: string
  messages: ChatMessage[]
}

export type ChatSessionListResponse = {
  sessions: ChatSession[]
}

export function askProjectChat(projectId: number, data: ChatAskRequest) {
  return apiRequest<ChatAskResponse>(`/api/projects/${projectId}/chat/ask`, {
    method: "POST",
    body: JSON.stringify(data),
    auth: true,
  })
}

export function getProjectChatSessions(projectId: number) {
  return apiRequest<ChatSessionListResponse>(
    `/api/projects/${projectId}/chat/sessions`,
    { auth: true }
  )
}

export function getChatSession(sessionId: number) {
  return apiRequest<ChatSession>(`/api/chat/sessions/${sessionId}`, {
    auth: true,
  })
}

export function deleteChatSession(sessionId: number) {
  return apiRequest<void>(`/api/chat/sessions/${sessionId}`, {
    method: "DELETE",
    auth: true,
  })
}
