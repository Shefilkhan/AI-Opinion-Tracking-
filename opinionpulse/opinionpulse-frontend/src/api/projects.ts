import { apiRequest } from "@/api/client"

export type Project = {
  id: number
  user_id: number
  name: string
  description: string | null
  tracking_frequency: string
  created_at: string
  updated_at: string
}

export type ProjectListResponse = {
  projects: Project[]
  total: number
}

export type ProjectCreateData = {
  name: string
  description?: string
  tracking_frequency: "manual" | "daily" | "weekly"
}

export type ProjectUpdateData = Partial<ProjectCreateData>

export function getProjects() {
  return apiRequest<ProjectListResponse>("/api/projects", { auth: true })
}

export function createProject(data: ProjectCreateData) {
  return apiRequest<Project>("/api/projects", {
    method: "POST",
    body: data,
    auth: true,
  })
}

export function getProject(id: number) {
  return apiRequest<Project>(`/api/projects/${id}`, { auth: true })
}

export function updateProject(id: number, data: ProjectUpdateData) {
  return apiRequest<Project>(`/api/projects/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  })
}

export function deleteProject(id: number) {
  return apiRequest<void>(`/api/projects/${id}`, {
    method: "DELETE",
    auth: true,
  })
}
