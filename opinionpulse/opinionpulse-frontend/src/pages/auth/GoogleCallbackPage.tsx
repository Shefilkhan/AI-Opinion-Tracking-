import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { getCurrentUser } from "@/api/auth"
import { useAuth } from "@/contexts/AuthContext"
import { setToken } from "@/lib/authStore"
import { pageShell } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

function readTokenFromHash(): string | null {
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash
  if (!raw) return null
  return new URLSearchParams(raw).get("token")
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
      const token = readTokenFromHash()

      if (token) {
        setToken(token)
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?redirect=${encodeURIComponent(redirect)}`
        )
      }

      try {
        const me = await getCurrentUser()
        if (cancelled) return
        setUser(me)
        navigate(redirect, { replace: true })
      } catch {
        if (!cancelled) {
          setError("Google sign-in could not be completed. Please try again.")
        }
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
