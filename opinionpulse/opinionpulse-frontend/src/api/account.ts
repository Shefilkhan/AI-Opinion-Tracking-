import { apiRequest } from "@/api/client"
import type { UserProfile, UserStats } from "@/api/users"

export type AccountProfile = UserProfile
export type AccountStats = UserStats

export function getAccountProfile() {
  return apiRequest<AccountProfile>("/api/account/profile", { auth: true })
}

export function updateAccountProfile(data: {
  name?: string
  full_name?: string
  username?: string | null
  bio?: string | null
}) {
  return apiRequest<AccountProfile>("/api/account/profile", {
    method: "PUT",
    body: data,
    auth: true,
  })
}

export function updateAccountPassword(data: {
  current_password: string
  new_password: string
  confirm_password: string
}) {
  return apiRequest<{ message: string }>("/api/account/password", {
    method: "PUT",
    body: data,
    auth: true,
  })
}

export function getAccountStats() {
  return apiRequest<AccountStats>("/api/account/stats", { auth: true })
}
