import { apiRequest } from "@/api/client"

export type AccountProfile = {
  id: number
  name: string
  email: string
  role: string
  is_email_verified: boolean
  created_at: string
  last_login_at: string | null
}

export type AccountStats = {
  total_searches: number
  total_results: number
  saved_searches: number
}

export function getAccountProfile() {
  return apiRequest<AccountProfile>("/api/account/profile", { auth: true })
}

export function updateAccountProfile(data: { name: string }) {
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
