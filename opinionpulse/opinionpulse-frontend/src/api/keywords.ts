import { apiRequest } from "@/api/client"

export type Keyword = {
  id: number
  project_id: number
  keyword: string
  keyword_type: string
  created_at: string
}

export type KeywordListResponse = {
  keywords: Keyword[]
  total: number
}

export type KeywordCreateData = {
  keyword: string
  keyword_type: "brand" | "product" | "competitor" | "topic" | "hashtag" | "person"
}

export function getProjectKeywords(projectId: number) {
  return apiRequest<KeywordListResponse>(
    `/api/projects/${projectId}/keywords`,
    { auth: true }
  )
}

export function createKeyword(projectId: number, data: KeywordCreateData) {
  return apiRequest<Keyword>(`/api/projects/${projectId}/keywords`, {
    method: "POST",
    body: data,
    auth: true,
  })
}

export function deleteKeyword(keywordId: number) {
  return apiRequest<void>(`/api/keywords/${keywordId}`, {
    method: "DELETE",
    auth: true,
  })
}
