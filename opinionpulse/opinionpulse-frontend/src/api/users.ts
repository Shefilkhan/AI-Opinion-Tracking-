import { apiRequest, getApiBaseUrl } from "@/api/client"
import { getToken } from "@/lib/authStore"

export type UserProfile = {
  id: number
  name: string
  full_name: string
  email: string
  role: string
  is_email_verified: boolean
  avatar_url: string | null
  username: string | null
  bio: string | null
  created_at: string
  last_login_at: string | null
}

export type UserStats = {
  total_searches: number
  total_results: number
  saved_searches: number
  total_chats: number
  member_since: string | null
  last_active: string | null
}

export function getUserStats() {
  return apiRequest<UserStats>("/api/users/stats", { auth: true })
}

export function patchUserProfile(data: {
  full_name?: string
  username?: string | null
  bio?: string | null
}) {
  return apiRequest<UserProfile>("/api/users/profile", {
    method: "PATCH",
    body: data,
    auth: true,
  })
}

export function checkUsernameAvailable(username: string) {
  return apiRequest<{ available: boolean }>(
    `/api/users/username/check?username=${encodeURIComponent(username)}`,
    { auth: true }
  )
}

export async function uploadUserAvatar(file: File): Promise<{ avatar_url: string }> {
  const token = getToken()
  const base = getApiBaseUrl()
  const form = new FormData()
  form.append("file", file)

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${base}/api/users/avatar`, {
    method: "POST",
    headers,
    credentials: "include",
    body: form,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Avatar upload failed"
    )
  }

  return res.json() as Promise<{ avatar_url: string }>
}
