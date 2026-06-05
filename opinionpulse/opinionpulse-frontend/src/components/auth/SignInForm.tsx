import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2 } from "lucide-react"
import { signInUser } from "@/api/auth"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { authInputClass, authLabelClass, GoogleIcon } from "@/lib/auth/authUi"
import { signInSchema, type SignInFormValues } from "@/lib/validations/auth"

export function SignInForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/dashboard"

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
        { state: { devOtpCode: res.dev_otp_code ?? undefined } }
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
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {rootMessage}
        </p>
      )}

      {errors.root && !showAttemptsBanner && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      )}

      <div className="mb-8">
        <h2 className="mb-1 text-2xl font-bold text-gray-900">
          Sign in to OpinionPulse
        </h2>
        <p className="text-sm text-gray-500">
          Track public opinion across 10 live data sources.
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
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        <div className="mt-2 flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-purple-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
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
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">or continue with</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        disabled
        title="Google OAuth — coming soon"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  )
}
