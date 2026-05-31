import { apiRequest } from "@/api/client"

export type AlertType =
  | "negative_sentiment"
  | "high_volume"
  | "keyword_mention"
  | "source_volume"

export type Alert = {
  id: number
  project_id: number
  alert_type: AlertType
  condition_text: string
  threshold_value: number
  keyword: string | null
  source: string | null
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
}

export type AlertCreate = {
  alert_type: AlertType
  threshold_value: number
  keyword?: string | null
  source?: string | null
  is_active?: boolean
}

export type AlertUpdate = {
  threshold_value?: number
  keyword?: string | null
  source?: string | null
  is_active?: boolean
}

export type AlertEvaluationResult = {
  alert_id: number
  alert_type: string
  triggered: boolean
  message: string
  is_active: boolean
}

export type AlertEvaluationResponse = {
  project_id: number
  evaluated: number
  triggered: number
  results: AlertEvaluationResult[]
}

export function getProjectAlerts(projectId: number) {
  return apiRequest<{ alerts: Alert[]; total: number }>(
    `/api/projects/${projectId}/alerts`,
    { auth: true }
  )
}

export function createAlert(projectId: number, data: AlertCreate) {
  return apiRequest<Alert>(`/api/projects/${projectId}/alerts`, {
    method: "POST",
    body: data,
    auth: true,
  })
}

export function updateAlert(alertId: number, data: AlertUpdate) {
  return apiRequest<Alert>(`/api/alerts/${alertId}`, {
    method: "PUT",
    body: data,
    auth: true,
  })
}

export function deleteAlert(alertId: number) {
  return apiRequest<void>(`/api/alerts/${alertId}`, {
    method: "DELETE",
    auth: true,
  })
}

export function evaluateProjectAlerts(projectId: number) {
  return apiRequest<AlertEvaluationResponse>(
    `/api/projects/${projectId}/alerts/evaluate`,
    { method: "POST", auth: true }
  )
}
