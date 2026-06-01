import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiError } from "@/api/client"
import { forgotPassword, resetPassword } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { z } from "zod"

const emailSchema = forgotPasswordSchema
type EmailValues = z.infer<typeof emailSchema>

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const presetEmail = searchParams.get("email") ?? ""
  const presetCode = searchParams.get("code") ?? ""
  const isResetStep = Boolean(presetEmail && presetCode)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: presetEmail },
  })

  async function onRequestEmail(values: EmailValues) {
    try {
      await forgotPassword(values.email)
      showToast("If an account exists, a code was sent", "success")
      navigate(
        `/auth/verify-otp?email=${encodeURIComponent(values.email)}&type=password_reset`
      )
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again."
      setResetError(message)
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.")
      return
    }
    setResetLoading(true)
    try {
      await resetPassword({
        email: presetEmail,
        otp_code: presetCode,
        new_password: newPassword,
      })
      showToast("Password updated. Please sign in.", "success")
      navigate("/auth/signin", { replace: true })
    } catch (err) {
      setResetError(
        err instanceof ApiError ? err.detail : "Could not reset password."
      )
    } finally {
      setResetLoading(false)
    }
  }

  if (isResetStep) {
    return (
      <AuthLayout
        title="Set a new password"
        subtitle="Choose a strong password for your account."
        footerText="Remember your password?"
        footerLink="/auth/signin"
        footerLinkLabel="Sign in"
      >
        <form onSubmit={onResetPassword} className="space-y-4">
          {resetError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {resetError}
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">
              New password
            </label>
            <PasswordInput
              id="new_password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">
              Confirm password
            </label>
            <PasswordInput
              id="confirm_password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            disabled={resetLoading}
            className={cn("w-full min-h-11", btnPrimary)}
          >
            {resetLoading ? "Please wait…" : "Update password"}
          </Button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="We'll email you a code to reset your password."
      footerText="Back to"
      footerLink="/auth/signin"
      footerLinkLabel="Sign in"
    >
      <form onSubmit={handleSubmit(onRequestEmail)} className="space-y-4">
        {resetError && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {resetError}
          </p>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-muted-foreground">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={inputSurface}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn("w-full min-h-11", btnPrimary)}
        >
          {isSubmitting ? "Please wait…" : "Send reset code"}
        </Button>
        <p className="text-center text-sm">
          <Link to="/auth/signin" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
