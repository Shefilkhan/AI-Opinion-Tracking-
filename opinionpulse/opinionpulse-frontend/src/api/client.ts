import { getToken, removeToken } from "@/lib/authStore"
import { triggerUpgradeModal } from "@/contexts/UpgradeModalContext"

/** In dev, use Vite proxy (same origin). Override with VITE_API_BASE_URL in .env */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "http://localhost:8000")

export class ApiError extends Error {
  status: number
  detail: string
  limitExceeded?: boolean

  constructor(status: number, detail: string, limitExceeded = false) {
    super(detail)
    this.status = status
    this.detail = detail
    this.limitExceeded = limitExceeded
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  /** Abort the request after this many milliseconds (default: no limit). */
  timeoutMs?: number
  /** Optional caller-controlled abort (e.g. cancel stale search). */
  signal?: AbortSignal
}

function linkAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  const abort = () => controller.abort()
  for (const signal of signals) {
    if (signal.aborted) {
      abort()
      break
    }
    signal.addEventListener("abort", abort, { once: true })
  }
  return controller.signal
}

function parseLimitDetail(data: unknown): { message: string; upgradeTo: string } | null {
  if (!data || typeof data !== "object") return null
  const record = data as Record<string, unknown>
  const detail = record.detail
  if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>
    if (d.error === "limit_exceeded") {
      return {
        message:
          typeof d.message === "string"
            ? d.message
            : "Upgrade your plan to continue",
        upgradeTo: typeof d.upgrade_to === "string" ? d.upgrade_to : "pro",
      }
    }
  }
  return null
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

  const timeoutController = options.timeoutMs ? new AbortController() : null
  const timeoutId =
    timeoutController && options.timeoutMs
      ? window.setTimeout(() => timeoutController.abort(), options.timeoutMs)
      : null

  const signals = [options.signal, timeoutController?.signal].filter(
    (s): s is AbortSignal => Boolean(s)
  )
  const fetchSignal =
    signals.length === 0
      ? undefined
      : signals.length === 1
        ? signals[0]
        : linkAbortSignals(signals)

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: "include",
      signal: fetchSignal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (timeoutId) window.clearTimeout(timeoutId)
    if (err instanceof Error && err.name === "AbortError") {
      if (options.signal?.aborted) {
        throw new ApiError(0, "Request cancelled")
      }
      throw new ApiError(
        0,
        import.meta.env.DEV
          ? `Search timed out. Check that the backend is running on port 8000 and MySQL is up.`
          : "Request timed out. Please try again."
      )
    }
    const hint =
      import.meta.env.DEV
        ? ` Cannot reach ${url || path}. Is uvicorn running on port 8000?`
        : ""
    const msg =
      err instanceof Error ? `${err.message}${hint}` : `Network error${hint}`
    throw new ApiError(0, msg)
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
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
    if (response.status === 402) {
      const limit = parseLimitDetail(data)
      if (limit) {
        triggerUpgradeModal(limit.message, limit.upgradeTo)
      }
      throw new ApiError(
        402,
        limit?.message ?? "Plan limit exceeded",
        true
      )
    }
    if (response.status === 401 && auth) {
      // Session expired or revoked server-side. Clear the stale token and
      // signal the app to re-authenticate instead of silently degrading.
      removeToken()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("opinionpulse:session-expired"))
      }
    }
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
