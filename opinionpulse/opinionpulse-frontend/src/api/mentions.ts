import { apiRequest } from "@/api/client"
import type { SentimentBrief } from "@/api/sentiment"

export type Mention = {
  id: number
  project_id: number
  source: string
  source_item_id: string | null
  source_parent_id: string | null
  author: string | null
  text: string
  cleaned_text: string | null
  url: string | null
  published_at: string | null
  engagement_score: number
  created_at: string
  sentiment: SentimentBrief | null
}

export type MentionListResponse = {
  mentions: Mention[]
  total: number
  limit: number
  offset: number
}

export type MentionStatsResponse = {
  total_mentions: number
  by_source: Record<string, number>
}

export type MentionCreateData = {
  source?: "reddit" | "youtube" | "gdelt" | "hackernews" | "manual"
  author?: string
  text: string
  url?: string
  engagement_score?: number
}

export type MentionQueryParams = {
  source?: string
  search?: string
  limit?: number
  offset?: number
}

export function getProjectMentions(projectId: number, params: MentionQueryParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.source && params.source !== "all") {
    searchParams.set("source", params.source)
  }
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim())
  }
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit))
  }
  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset))
  }
  const qs = searchParams.toString()
  const path = `/api/projects/${projectId}/mentions${qs ? `?${qs}` : ""}`
  return apiRequest<MentionListResponse>(path, { auth: true })
}

export function createMention(projectId: number, data: MentionCreateData) {
  return apiRequest<Mention>(`/api/projects/${projectId}/mentions`, {
    method: "POST",
    body: { source: "manual", ...data },
    auth: true,
  })
}

export function getMentionStats(projectId: number) {
  return apiRequest<MentionStatsResponse>(
    `/api/projects/${projectId}/mentions/stats`,
    { auth: true }
  )
}

export function seedMentions(projectId: number) {
  return apiRequest<{ inserted: number; message: string }>(
    `/api/projects/${projectId}/mentions/seed`,
    { method: "POST", auth: true }
  )
}

export function deleteMention(mentionId: number) {
  return apiRequest<{ message: string }>(`/api/mentions/${mentionId}`, {
    method: "DELETE",
    auth: true,
  })
}
