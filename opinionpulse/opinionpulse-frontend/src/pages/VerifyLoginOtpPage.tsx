import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ApiError } from "@/api/client"
import { resendLoginOtp, verifyLoginOtp } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { OtpInput } from "@/components/auth/OtpInput"
import { Button } from "@/components/ui/button"
import { btnPrimary, successSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function VerifyLoginOtpPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get("email") ?? ""
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError("Missing email. Please log in again.")
      return
    }
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await verifyLoginOtp(email, otp)
      navigate("/dashboard")
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
    setResent(null)
    try {
      const res = await resendLoginOtp(email)
      setResent(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not resend OTP.")
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Enter login code"
      subtitle={
        email
          ? `We sent a login code to ${email}. It should arrive within a few seconds.`
          : "Enter the code from your email."
      }
      footerText="Back to"
      footerLink="/login"
      footerLinkLabel="Login"
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        {resent && !error && <p className={successSurface}>{resent}</p>}
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className={cn("w-full", btnPrimary)}>
          {loading ? "Verifying…" : "Verify & continue"}
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
    </AuthLayout>
  )
}
