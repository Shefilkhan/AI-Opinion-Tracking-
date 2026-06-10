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
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  )
}
