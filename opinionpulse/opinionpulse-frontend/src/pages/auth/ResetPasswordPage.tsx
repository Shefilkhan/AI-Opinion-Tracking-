import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiError } from "@/api/client"
import { resetPassword } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
  getPasswordRequirements,
  getPasswordStrength,
  STRENGTH_COLORS,
} from "@/lib/auth/passwordStrength"
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
type LocationState = {
  email: string
  otp_code: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const state = location.state as LocationState | null

  const [rootError, setRootError] = useState<string | null>(null)

  useEffect(() => {
    if (!state?.email || !state?.otp_code) {
      navigate("/auth/forgot-password", { replace: true })
    }
  }, [state, navigate])

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: state?.email ?? "",
      otp_code: state?.otp_code ?? "",
      new_password: "",
      confirmPassword: "",
    },
  })

  const password = watch("new_password") ?? ""
  const strength = useMemo(() => getPasswordStrength(password), [password])
  const requirements = useMemo(() => getPasswordRequirements(password), [password])

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!state) return
    setRootError(null)
    try {
      await resetPassword({
        email: values.email,
        otp_code: values.otp_code,
        new_password: values.new_password,
      })
      showToast("Password updated. Please sign in.", "success")
      navigate("/auth/signin", { replace: true })
    } catch (err) {
      setRootError(
        err instanceof ApiError ? err.detail : "Could not reset password. Try again."
      )
    }
  }

  if (!state?.email || !state?.otp_code) {
    return null
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      footerText="Remember your password?"
      footerLink="/auth/signin"
      footerLinkLabel="Sign in"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {rootError}
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            New password
          </label>
          <Controller
            name="new_password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                id="new_password"
                value={field.value}
                onChange={field.onChange}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.new_password)}
              />
            )}
          />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-gray-200",
                  i < strength.score && STRENGTH_COLORS[strength.level]
                )}
              />
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {requirements.map((req) => (
              <li
                key={req.id}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  req.met ? "text-success" : "text-muted-foreground"
                )}
              >
                <Check className={cn("size-3", !req.met && "opacity-30")} />
                {req.label}
              </li>
            ))}
          </ul>
          {errors.new_password && (
            <p className="mt-1 text-sm text-destructive">
              {errors.new_password.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Confirm password
          </label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput
                id="confirmPassword"
                value={field.value}
                onChange={field.onChange}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn("w-full min-h-11", btnPrimary)}
        >
          {isSubmitting ? "Please wait…" : "Update password"}
        </Button>

        <p className="text-center text-sm">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">
            Request a new code
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
