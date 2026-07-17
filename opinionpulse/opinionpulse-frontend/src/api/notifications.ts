import { apiRequest } from "@/api/client"

export type AppNotification = {
  id: string
  type: string
  title: string
  message: string
  href: string | null
  read: boolean
  created_at: string
}

export type NotificationsResponse = {
  items: AppNotification[]
  unread_count: number
}

export function listNotifications(limit = 30) {
  return apiRequest<NotificationsResponse>(`/api/notifications?limit=${limit}`, {
    auth: true,
  })
}

export function markNotificationRead(id: string) {
  return apiRequest<AppNotification>(`/api/notifications/${id}/read`, {
    method: "PATCH",
    auth: true,
  })
}

export function markAllNotificationsRead() {
  return apiRequest<{ success: boolean }>("/api/notifications/read-all", {
    method: "POST",
    auth: true,
  })
}
