import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getAuthProviders, getGoogleAuthUrl } from "@/api/auth"
import { GoogleIcon } from "@/lib/auth/authUi"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

type GoogleSignInButtonProps = {
  redirect?: string
}

export function GoogleSignInButton({ redirect = "/dashboard" }: GoogleSignInButtonProps) {
  const { showToast } = useToast()
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    getAuthProviders()
      .then((res) => {
        if (!cancelled) setConfigured(res.google.configured)
      })
      .catch(() => {
        if (!cancelled) setConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleClick() {
    if (configured === false) {
      showToast(
        "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env.local.",
        "error"
      )
      return
    }
    window.location.href = getGoogleAuthUrl(redirect)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={configured === null}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors duration-200",
        "hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:opacity-70",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
    >
      {configured === null ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading Google sign-in…
        </>
      ) : (
        <>
          <GoogleIcon />
          Continue with Google
        </>
      )}
    </button>
  )
}
