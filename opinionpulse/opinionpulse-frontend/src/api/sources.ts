import { apiRequest } from "@/api/client"

export type Source = {
  id: number
  project_id: number
  source_name: string
  is_enabled: boolean
  created_at: string
}

export type SourceListResponse = {
  sources: Source[]
}

export type SourceUpdateItem = {
  source_name: "reddit" | "youtube" | "gdelt"
  is_enabled: boolean
}

export function getProjectSources(projectId: number) {
  return apiRequest<SourceListResponse>(
    `/api/projects/${projectId}/sources`,
    { auth: true }
  )
}

export function updateProjectSources(
  projectId: number,
  sources: SourceUpdateItem[]
) {
  return apiRequest<SourceListResponse>(`/api/projects/${projectId}/sources`, {
    method: "PUT",
    body: { sources },
    auth: true,
  })
}
