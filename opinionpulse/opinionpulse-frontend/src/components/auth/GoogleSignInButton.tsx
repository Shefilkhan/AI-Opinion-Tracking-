import { GoogleIcon } from "@/lib/auth/authUi"
import { getGoogleAuthUrl } from "@/api/auth"

type GoogleSignInButtonProps = {
  redirect?: string
}

export function GoogleSignInButton({ redirect = "/dashboard" }: GoogleSignInButtonProps) {
  function handleClick() {
    window.location.href = getGoogleAuthUrl(redirect)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  )
}
