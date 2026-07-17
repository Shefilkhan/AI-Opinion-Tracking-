import { setToken } from "@/lib/authStore"

/** Persist Google OAuth token from URL before React auth bootstrap runs. */
export function bootstrapOAuthTokenFromUrl(): boolean {
  if (typeof window === "undefined") return false
  if (!window.location.pathname.startsWith("/auth/google/callback")) return false

  const url = new URL(window.location.href)
  const fromQuery = url.searchParams.get("token")
  const fromHash = new URLSearchParams(
    url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  ).get("token")
  const token = fromQuery || fromHash
  if (!token) return false

  setToken(token)
  return true
}

export function isGoogleOAuthCallback(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth/google/callback")
  )
}
