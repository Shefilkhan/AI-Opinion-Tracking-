import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiError } from "@/api/client"
import { forgotPassword } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
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
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  async function onRequestEmail(values: EmailValues) {
    try {
      const res = await forgotPassword(values.email)
      showToast("If an account exists, a code was sent", "success")
      navigate(
        `/auth/verify-otp?email=${encodeURIComponent(values.email)}&type=password_reset`,
        { state: { devOtpCode: res.dev_otp_code ?? undefined } }
      )
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again."
      setError("email", { message })
    }
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="We'll email you a 6-digit code to reset your password (expires in 2 minutes)."
      footerText="Back to"
      footerLink="/auth/signin"
      footerLinkLabel="Sign in"
    >
      <form onSubmit={handleSubmit(onRequestEmail)} className="space-y-4" noValidate>
        {errors.root && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
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
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
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
