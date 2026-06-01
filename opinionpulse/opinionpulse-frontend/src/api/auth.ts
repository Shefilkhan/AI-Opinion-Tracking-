import { apiRequest } from "@/api/client"
import { removeToken, setToken } from "@/lib/authStore"

export type User = {
  id: number
  name: string
  email: string
  role: string
  is_email_verified?: boolean
  created_at: string
  last_login_at?: string | null
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

export type RegisterPendingResponse = {
  message: string
  email: string
  requires_otp: boolean
  dev_otp_code?: string | null
}

export type LoginPendingResponse = {
  message: string
  email: string
  requires_login_otp?: boolean
  requires_email_verification?: boolean
  dev_otp_code?: string | null
}

export type ResendOtpResponse = {
  message: string
  dev_otp_code?: string | null
}

export async function registerUser(data: RegisterData): Promise<RegisterPendingResponse> {
  return apiRequest<RegisterPendingResponse>("/api/auth/register", {
    method: "POST",
    body: data,
  })
}

export async function verifyRegisterOtp(email: string, otp_code: string) {
  return apiRequest<{ message: string; verified: boolean }>(
    "/api/auth/verify-register-otp",
    { method: "POST", body: { email, otp_code } }
  )
}

export async function resendRegisterOtp(email: string) {
  return apiRequest<ResendOtpResponse>("/api/auth/resend-register-otp", {
    method: "POST",
    body: { email },
  })
}

export async function loginUser(data: LoginData): Promise<LoginPendingResponse> {
  return apiRequest<LoginPendingResponse>("/api/auth/login", {
    method: "POST",
    body: data,
  })
}

export async function verifyLoginOtp(
  email: string,
  otp_code: string
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/api/auth/verify-login-otp", {
    method: "POST",
    body: { email, otp_code },
  })
  setToken(response.access_token)
  return response
}

export async function resendLoginOtp(email: string) {
  return apiRequest<ResendOtpResponse>("/api/auth/resend-login-otp", {
    method: "POST",
    body: { email },
  })
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/auth/me", { auth: true })
}

export function logoutUser(): void {
  removeToken()
}
