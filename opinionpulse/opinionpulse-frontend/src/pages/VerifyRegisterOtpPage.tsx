import { useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { ApiError } from "@/api/client"
import { resendRegisterOtp, verifyRegisterOtp } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { DevOtpBanner } from "@/components/auth/DevOtpBanner"
import { OtpInput } from "@/components/auth/OtpInput"
import { Button } from "@/components/ui/button"
import { btnPrimary, successSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type LocationState = {
  devOtpCode?: string
}

export function VerifyRegisterOtpPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const email = searchParams.get("email") ?? ""
  const initialDevOtp = (location.state as LocationState | null)?.devOtpCode
  const [devOtpCode, setDevOtpCode] = useState<string | undefined>(initialDevOtp)
  const [otp, setOtp] = useState(initialDevOtp ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError("Missing email. Please sign up again.")
      return
    }
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await verifyRegisterOtp(email, otp)
      setSuccess("Email verified. Redirecting to dashboard…")
      setTimeout(() => navigate("/dashboard"), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) return
    setResending(true)
    setError(null)
    try {
      const res = await resendRegisterOtp(email)
      setSuccess(res.message)
      if (res.dev_otp_code) {
        setDevOtpCode(res.dev_otp_code)
        setOtp(res.dev_otp_code)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not resend OTP.")
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email
          ? `We sent a verification code to ${email}. It should arrive within a few seconds.`
          : "Enter the code we sent to your email."
      }
      footerText="Back to"
      footerLink="/signup"
      footerLinkLabel="Sign up"
    >
      <form onSubmit={handleVerify} className="space-y-6">
        {import.meta.env.DEV && devOtpCode ? (
          <DevOtpBanner code={devOtpCode} />
        ) : null}
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && <p className={successSurface}>{success}</p>}
        <Button type="submit" disabled={loading} className={cn("w-full", btnPrimary)}>
          {loading ? "Verifying…" : "Verify email"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={resending || !email}
          onClick={handleResend}
        >
          {resending ? "Sending…" : "Resend code"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Go to login
        </Link>
      </p>
    </AuthLayout>
  )
}
