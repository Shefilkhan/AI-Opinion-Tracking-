import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2 } from "lucide-react"
import { signInUser } from "@/api/auth"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { authInputClass, authLabelClass } from "@/lib/auth/authUi"
import { signInSchema, type SignInFormValues } from "@/lib/validations/auth"

export function SignInForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/dashboard"
  const oauthError = searchParams.get("error")

  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const email = watch("email") ?? ""
  const rootMessage = errors.root?.message ?? ""
  const showAttemptsBanner =
    /attempt|lockout|locked|failed/i.test(rootMessage) && rootMessage.length > 0

  async function onSubmit(values: SignInFormValues) {
    try {
      const res = await signInUser(values)
      const type = res.requires_email_verification ? "signup" : "login"
      navigate(
        `/auth/verify-otp?email=${encodeURIComponent(res.email)}&type=${type}&redirect=${encodeURIComponent(redirect)}`,
        { state: { devOtpCode: res.dev_otp_code ?? null } }
      )
    } catch (err) {
      setError("root", { message: getApiErrorMessage(err) })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {showAttemptsBanner && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {rootMessage}
        </p>
      )}

      {(oauthError || (errors.root && !showAttemptsBanner)) && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {oauthError ?? errors.root?.message}
        </p>
      )}

      <div className="mb-8">
        <h2 className="le-auth-form-title mb-1">Sign in to OpinionPulse</h2>
        <p className="le-auth-form-subtitle">
          Track public opinion across 13 live data sources.
        </p>
      </div>

      <div>
        <label htmlFor="email" className={authLabelClass}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={authInputClass({
            error: Boolean(errors.email),
            success: Boolean(email && !errors.email),
          })}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className={authLabelClass}>
          Password
        </label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              id="password"
              value={field.value}
              onChange={field.onChange}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
            />
          )}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
        <div className="mt-2 flex justify-end">
          <Link to="/auth/forgot-password" className="le-auth-link text-sm">
            Forgot password?
          </Link>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="le-btn-solid-full">
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="le-auth-divider" />
        <span className="text-xs font-medium text-[var(--le-muted)]">or continue with</span>
        <div className="le-auth-divider" />
      </div>

      <GoogleSignInButton redirect={redirect} />
    </form>
  )
}
