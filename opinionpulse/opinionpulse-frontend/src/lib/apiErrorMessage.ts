import { ApiError } from "@/api/client"

/** Map API/network failures to a user-visible message. */
export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (err instanceof ApiError) {
    return err.detail || fallback
  }
  if (err instanceof TypeError && /fetch|network|Failed/i.test(err.message)) {
    return (
      "Cannot reach the API server. Start the backend with: " +
      "cd opinionpulse/opinionpulse-backend && uvicorn app.main:app --reload"
    )
  }
  if (err instanceof SyntaxError) {
    return "Invalid response from server (is the API running on the correct port?)."
  }
  if (err instanceof Error && err.message) {
    return import.meta.env.DEV ? err.message : fallback
  }
  return fallback
}
