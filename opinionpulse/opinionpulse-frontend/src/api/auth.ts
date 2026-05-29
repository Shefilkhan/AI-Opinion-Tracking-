import { apiRequest } from "@/api/client"
import { removeToken, setToken } from "@/lib/authStore"

export type User = {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}

export type RegisterData = {
  name: string
  email: string
  password: string
}

export type LoginData = {
  email: string
  password: string
}

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: data,
  })
  setToken(response.access_token)
  return response
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: data,
  })
  setToken(response.access_token)
  return response
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/auth/me", { auth: true })
}

export function logoutUser(): void {
  removeToken()
}
