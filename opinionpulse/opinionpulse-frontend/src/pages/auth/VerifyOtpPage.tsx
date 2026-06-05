import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Clock, Loader2 } from "lucide-react"
import { ApiError } from "@/api/client"
import {
  resendOtp,
  verifyOtp,
  verifyPasswordResetOtp,
  type AuthResponse,
  type OtpType,
} from "@/api/auth"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { DevOtpBanner } from "@/components/auth/DevOtpBanner"
import { OtpInput } from "@/components/auth/OtpInput"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/contexts/AuthContext"
import { maskEmail } from "@/lib/auth/maskEmail"
import { cn } from "@/lib/utils"

const OTP_SECONDS = 120
const MAX_RESENDS = 3

function parseOtpType(raw: string | null): OtpType {
  if (raw === "signup" || raw === "SIGNUP_VERIFY") return "signup"
  if (raw === "password_reset" || raw === "PASSWORD_RESET") return "password_reset"
  return "login"
}

export function VerifyOtpPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { setUser, refreshUser } = useAuth()

  const email = searchParams.get("email") ?? ""
  const type = parseOtpType(searchParams.get("type"))
  const redirect = searchParams.get("redirect") ?? "/dashboard"
  const devOtpFromState = (location.state as { devOtpCode?: string } | null)?.devOtpCode

  const [code, setCode] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS)
  const [resendCooldown, setResendCooldown] = useState(OTP_SECONDS)
  const [resendCount, setResendCount] = useState(0)
  const [devOtp, setDevOtp] = useState<string | undefined>(devOtpFromState)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const submitLockRef = useRef(false)

  useEffect(() => {
    if (!email) navigate("/auth/signin", { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const expired = secondsLeft <= 0
  const timerUrgent = secondsLeft > 0 && secondsLeft <= 30

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendCount >= MAX_RESENDS) return
    setError(null)
    try {
      const res = await resendOtp(email, type)
      setResendCount((c) => c + 1)
      setSecondsLeft(OTP_SECONDS)
      setResendCooldown(OTP_SECONDS)
      if (res.dev_otp_code) setDevOtp(res.dev_otp_code)
      showToast("A new code has been sent", "success")
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not resend code. Try again."
      )
    }
  }, [email, type, resendCooldown, resendCount, showToast])

  const submitVerification = useCallback(
    async (otpCode: string) => {
      if (submitLockRef.current || loading) return
      if (otpCode.length !== 6) {
        setError("Enter the full 6-digit code.")
        return
      }
      if (secondsLeft <= 0) {
        setError("Code expired. Please request a new code.")
        return
      }

      submitLockRef.current = true
      setError(null)
      setLoading(true)
      try {
        if (type === "password_reset") {
          await verifyPasswordResetOtp(email, otpCode)
          navigate("/auth/reset-password", {
            replace: true,
            state: { email, otp_code: otpCode },
          })
          return
        }

        const res: AuthResponse = await verifyOtp(email, otpCode, type)
        setUser(res.user)
        await refreshUser()
        showToast("Signed in successfully", "success")
        navigate(redirect, { replace: true })
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.detail
            : "Something went wrong. Please try again."
        )
      } finally {
        setLoading(false)
        submitLockRef.current = false
      }
    },
    [
      email,
      loading,
      navigate,
      redirect,
      refreshUser,
      secondsLeft,
      setUser,
      showToast,
      type,
    ]
  )

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    void submitVerification(code)
  }

  const handleOtpComplete = useCallback(
    (otpCode: string) => {
      void submitVerification(otpCode)
    },
    [submitVerification]
  )

  const isPasswordReset = type === "password_reset"
  const footerLink = isPasswordReset
    ? "/auth/forgot-password"
    : type === "signup"
      ? "/auth/signup"
      : "/auth/signin"
  const footerLabel = isPasswordReset ? "Use a different email" : "Back to sign in"

  return (
    <AuthSplitLayout variant="otp">
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">
            {isPasswordReset ? "Verify reset code" : "Enter verification code"}
          </h2>
          <p className="text-sm text-gray-500">
            {isPasswordReset
              ? `Code sent to ${maskEmail(email)} to reset your password.`
              : `We sent a 6-digit code to ${maskEmail(email)}`}
          </p>
        </div>

        {import.meta.env.DEV && devOtp ? <DevOtpBanner code={devOtp} /> : null}

        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={handleOtpComplete}
          disabled={loading || expired}
          hasError={Boolean(error)}
        />

        <div
          className={cn(
            "flex items-center justify-center gap-2",
            timerUrgent && secondsLeft > 0 && "animate-pulse"
          )}
        >
          <Clock
            size={14}
            className={cn(
              expired || timerUrgent ? "text-red-400" : "text-gray-400"
            )}
          />
          <span
            className={cn(
              "font-mono text-sm font-medium",
              expired || timerUrgent ? "text-red-500" : "text-gray-500"
            )}
          >
            {expired ? "Code expired" : formatTime(secondsLeft)}
          </span>
        </div>

        <p className="text-center text-sm text-gray-500">
          {resendCooldown > 0 ? (
            <>Resend code in {formatTime(resendCooldown)}</>
          ) : resendCount >= MAX_RESENDS ? (
            <span className="text-red-600">Resend limit reached for this session.</span>
          ) : (
            <button
              type="button"
              className="font-medium text-purple-600 hover:underline"
              onClick={handleResend}
            >
              Didn&apos;t receive the code? Resend
            </button>
          )}
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6 || expired}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Please wait…
            </>
          ) : isPasswordReset ? (
            "Continue"
          ) : (
            "Verify Code"
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          Wrong account?{" "}
          <Link to={footerLink} className="font-medium text-purple-600 hover:underline">
            {footerLabel}
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}
