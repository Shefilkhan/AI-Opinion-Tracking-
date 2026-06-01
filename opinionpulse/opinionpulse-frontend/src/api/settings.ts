import { apiRequest } from "@/api/client"

export type SettingsStatus = {
  backend_connected: boolean
  email_configured: boolean
  gdelt_available: boolean
  youtube_configured: boolean
  reddit_configured: boolean
  environment: string
}

export function getSettingsStatus() {
  return apiRequest<SettingsStatus>("/api/settings/status", { auth: true })
}
