import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getAuthProviders, getGoogleAuthUrl } from "@/api/auth"
import { removeToken } from "@/lib/authStore"
import { GoogleIcon } from "@/lib/auth/authUi"
import { useToast } from "@/components/ui/toast"

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

  async function handleClick() {
    if (configured === false) {
      showToast(
        "Google sign-in is not configured. Ask your team lead for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, add them to opinionpulse-backend/.env.local, then restart the backend.",
        "error"
      )
      return
    }
    removeToken()
    window.location.href = getGoogleAuthUrl(redirect)
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={configured === null}
      className="le-auth-google-btn"
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
