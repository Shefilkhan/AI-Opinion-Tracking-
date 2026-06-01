import { getToken } from "@/lib/authStore"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (auth) {
    const token = getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e: { msg?: string }) => e.msg ?? "Error").join(", ")
          : "Request failed"
    throw new ApiError(response.status, detail)
  }

  return data as T
}
