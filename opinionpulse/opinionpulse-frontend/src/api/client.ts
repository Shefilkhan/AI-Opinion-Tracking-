import { getToken } from "@/lib/authStore"

/** In dev, use Vite proxy (same origin). Override with VITE_API_BASE_URL in .env */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "http://localhost:8000")

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

function parseErrorDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    if (typeof record.detail === "string") {
      return record.detail
    }
    if (typeof record.error === "string") {
      return record.error
    }
    if (Array.isArray(record.detail)) {
      return record.detail
        .map((e) => {
          if (e && typeof e === "object" && "msg" in e) {
            return String((e as { msg?: string }).msg ?? "Error")
          }
          return "Error"
        })
        .join(", ")
    }
  }
  return fallback
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

  const url = `${API_BASE}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    const hint =
      import.meta.env.DEV
        ? ` Cannot reach ${url || path}. Is uvicorn running on port 8000?`
        : ""
    const msg =
      err instanceof Error ? `${err.message}${hint}` : `Network error${hint}`
    throw new ApiError(0, msg)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let data: unknown = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(
        response.status,
        import.meta.env.DEV
          ? `Non-JSON response (${response.status}): ${text.slice(0, 200)}`
          : "Invalid server response"
      )
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parseErrorDetail(data, `Request failed (${response.status})`)
    )
  }

  return data as T
}

export function getApiBaseUrl(): string {
  return API_BASE || window.location.origin
}
