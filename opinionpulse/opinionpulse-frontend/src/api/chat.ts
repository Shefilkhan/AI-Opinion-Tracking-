import { apiRequest } from "@/api/client"

export type PulseChatDataUsed = {
  query?: string | null
  results_count: number
  sentiment: Record<string, number>
  platforms: string[]
}

export type PulseChatResponse = {
  conversation_id: string
  message: string
  suggestions: string[]
  data_used: PulseChatDataUsed
  wiki_summary?: Record<string, unknown> | null
  has_real_data: boolean
}

export type PulseConversation = {
  conversation_id: string
  started_at: string
  message_count: number
  first_message: string
}

export type PulseStoredMessage = {
  role: "user" | "assistant"
  content: string
  metadata?: {
    suggestions?: string[]
    data_used?: PulseChatDataUsed
    has_real_data?: boolean
  }
  created_at: string
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<PulseChatResponse> {
  return apiRequest<PulseChatResponse>("/api/chat/message", {
    method: "POST",
    body: { message, conversation_id: conversationId },
    auth: true,
  })
}

export async function listChatConversations(): Promise<{
  conversations: PulseConversation[]
}> {
  return apiRequest("/api/chat/conversations", { auth: true })
}

export async function getChatConversation(
  conversationId: string
): Promise<{ messages: PulseStoredMessage[] }> {
  return apiRequest(`/api/chat/conversations/${conversationId}`, { auth: true })
}

export async function deleteChatConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  return apiRequest(`/api/chat/conversations/${conversationId}`, {
    method: "DELETE",
    auth: true,
  })
}

export function getChatExportUrl(conversationId: string): string {
  const base =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV ? "" : "http://localhost:8000")
  return `${base}/api/chat/export/${conversationId}`
}
