import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { getCurrentUser } from "@/api/auth"
import { ApiError } from "@/api/client"
import { useAuth } from "@/contexts/AuthContext"
import { getToken, setToken } from "@/lib/authStore"
import { pageShell } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

function readOAuthToken(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get("token")
  if (fromQuery) return fromQuery

  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash
  if (!raw) return null
  return new URLSearchParams(raw).get("token")
}

function stripTokenFromUrl(redirect: string) {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?redirect=${encodeURIComponent(redirect)}`
  )
}

export function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function complete() {
      const redirect = searchParams.get("redirect") ?? "/dashboard"
      const token = readOAuthToken(searchParams) ?? getToken()

      if (token && token !== getToken()) {
        setToken(token)
      }

      if (!getToken()) {
        if (!cancelled) {
          setError(
            "Google sign-in could not be completed. No session token was returned. Please try again."
          )
        }
        return
      }

      try {
        const me = await getCurrentUser()
        if (cancelled) return
        setUser(me)
        stripTokenFromUrl(redirect)
        navigate(redirect, { replace: true })
      } catch (err) {
        if (cancelled) return
        if (import.meta.env.DEV && err instanceof ApiError) {
          setError(err.detail || "Google sign-in could not be completed.")
          return
        }
        setError("Google sign-in could not be completed. Please try again.")
      }
    }

    void complete()
    return () => {
      cancelled = true
    }
  }, [navigate, searchParams, setUser])

  if (error) {
    return (
      <div
        className={cn(
          "flex min-h-screen flex-col items-center justify-center gap-4 px-4",
          pageShell
        )}
      >
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/auth/signin", { replace: true })}
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground",
        pageShell
      )}
    >
      <Loader2 className="animate-spin text-primary" size={28} />
      <p className="text-sm">Completing Google sign-in...</p>
    </div>
  )
}
