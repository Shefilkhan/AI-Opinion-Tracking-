import { apiRequest } from "@/api/client"

export type PersonalAlert = {
  id: string
  keyword: string
  threshold: number
  frequency: string
  enabled: boolean
}

export async function listPersonalAlerts(): Promise<PersonalAlert[]> {
  return apiRequest<PersonalAlert[]>("/api/personal-alerts", { auth: true })
}

export async function createPersonalAlert(data: {
  keyword: string
  threshold: number
  frequency: string
}): Promise<PersonalAlert> {
  return apiRequest<PersonalAlert>("/api/personal-alerts", {
    method: "POST",
    auth: true,
    body: data,
  })
}

export async function updatePersonalAlert(
  id: string,
  data: Partial<{ enabled: boolean; threshold: number; frequency: string }>
): Promise<PersonalAlert> {
  return apiRequest<PersonalAlert>(`/api/personal-alerts/${id}`, {
    method: "PATCH",
    auth: true,
    body: data,
  })
}

export async function deletePersonalAlert(id: string): Promise<void> {
  return apiRequest<void>(`/api/personal-alerts/${id}`, {
    method: "DELETE",
    auth: true,
  })
}
