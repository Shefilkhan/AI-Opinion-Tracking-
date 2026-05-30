import { apiRequest } from "@/api/client"

export type CollectionSourceResult = {
  source: string
  keywords_checked: number
  fetched: number
  inserted: number
  duplicates_skipped: number
  message?: string
}

export type CollectionResponse = CollectionSourceResult

export type CollectAllResponse = {
  results: Record<string, CollectionSourceResult | string>
  total_inserted: number
  total_fetched: number
  message: string
}

export function collectGdelt(projectId: number) {
  return apiRequest<CollectionResponse>(
    `/api/projects/${projectId}/collect/gdelt`,
    { method: "POST", auth: true }
  )
}

export function collectAllSources(projectId: number) {
  return apiRequest<CollectAllResponse>(
    `/api/projects/${projectId}/collect/all`,
    { method: "POST", auth: true }
  )
}
