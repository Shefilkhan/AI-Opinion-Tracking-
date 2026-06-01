import { apiRequest } from "@/api/client"
import { removeToken, setToken } from "@/lib/authStore"

export type User = {
  id: number
  name: string
  email: string
  role: string
  is_email_verified?: boolean
  avatar_url?: string | null
  created_at: string
  last_login_at?: string | null
}

export type AuthResponse = {
  success?: boolean
  access_token: string
  token_type: string
  user: User
}

export type RegisterData = {
  full_name: string
  email: string
  password: string
}

export type LoginData = {
  email: string
  password: string
}

export type RegisterPendingResponse = {
  success: boolean
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
  success: boolean
  message: string
  dev_otp_code?: string | null
}

export type OtpType = "signup" | "login" | "password_reset"

export async function signUpUser(data: RegisterData): Promise<RegisterPendingResponse> {
  return apiRequest<RegisterPendingResponse>("/api/auth/signup", {
    method: "POST",
    body: {
      full_name: data.full_name,
      email: data.email,
      password: data.password,
    },
  })
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
}): Promise<RegisterPendingResponse> {
  return signUpUser({
    full_name: data.name,
    email: data.email,
    password: data.password,
  })
}

export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: { email, code, otp_code: code, type },
  })
  if (response.access_token) {
    setToken(response.access_token)
  }
  return response
}

export async function verifyRegisterOtp(email: string, otp_code: string) {
  return verifyOtp(email, otp_code, "signup")
}

export async function verifyLoginOtp(
  email: string,
  otp_code: string
): Promise<AuthResponse> {
  return verifyOtp(email, otp_code, "login")
}

export async function resendOtp(email: string, type: OtpType) {
  return apiRequest<ResendOtpResponse>("/api/auth/resend-otp", {
    method: "POST",
    body: { email, type },
  })
}

export async function resendRegisterOtp(email: string) {
  return resendOtp(email, "signup")
}

export async function resendLoginOtp(email: string) {
  return resendOtp(email, "login")
}

export async function signInUser(data: LoginData): Promise<LoginPendingResponse> {
  return apiRequest<LoginPendingResponse>("/api/auth/signin", {
    method: "POST",
    body: data,
  })
}

export async function loginUser(data: LoginData): Promise<LoginPendingResponse> {
  return signInUser(data)
}

export type ForgotPasswordResponse = {
  success: boolean
  message: string
  dev_otp_code?: string | null
}

export async function forgotPassword(email: string) {
  return apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  })
}

export async function verifyPasswordResetOtp(email: string, otp_code: string) {
  return apiRequest<{ message: string; verified: boolean }>(
    "/api/auth/verify-password-reset-otp",
    { method: "POST", body: { email, otp_code, code: otp_code } }
  )
}

export async function resetPassword(data: {
  email: string
  otp_code: string
  new_password: string
}) {
  return apiRequest<{ success: boolean; message: string }>(
    "/api/auth/reset-password",
    { method: "POST", body: data }
  )
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/auth/me", { auth: true })
}

export async function logoutUser(): Promise<void> {
  try {
    await apiRequest<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
      auth: true,
    })
  } finally {
    removeToken()
  }
}
