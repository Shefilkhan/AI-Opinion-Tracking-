import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Check, CheckCircle, Circle, Loader2 } from "lucide-react"
import { ApiError } from "@/api/client"
import { signUpUser } from "@/api/auth"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { PasswordInput } from "@/components/auth/PasswordInput"
import {
  authInputClass,
  authLabelClass,
  GoogleIcon,
  STRENGTH_HEX,
  STRENGTH_LABELS,
} from "@/lib/auth/authUi"
import {
  getPasswordRequirements,
  getPasswordStrength,
} from "@/lib/auth/passwordStrength"
import { signUpSchema, type SignUpFormValues } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

export function SignUpForm() {
  const navigate = useNavigate()
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const password = watch("password") ?? ""
  const email = watch("email") ?? ""
  const fullName = watch("full_name") ?? ""
  const strength = useMemo(() => getPasswordStrength(password), [password])
  const requirements = useMemo(() => getPasswordRequirements(password), [password])

  async function onSubmit(values: SignUpFormValues) {
    try {
      const res = await signUpUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      })
      navigate(
        `/auth/verify-otp?email=${encodeURIComponent(res.email)}&type=signup`,
        { state: { devOtpCode: res.dev_otp_code ?? undefined } }
      )
    } catch (err) {
      const message = getApiErrorMessage(err)
      if (err instanceof ApiError && err.status === 409) {
        setError("email", { message })
      } else {
        setError("root", { message })
      }
    }
  }

  const strengthColor = STRENGTH_HEX[strength.level] ?? STRENGTH_HEX.weak

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      )}

      <div className="mb-8">
        <h2 className="mb-1 text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="text-sm text-gray-500">
          Start tracking public opinion in minutes. Free 14-day Pro trial included.
        </p>
      </div>

      <div>
        <label htmlFor="full_name" className={authLabelClass}>
          Full Name
        </label>
        <input
          id="full_name"
          placeholder="John Doe"
          aria-invalid={Boolean(errors.full_name)}
          className={authInputClass({
            error: Boolean(errors.full_name),
            success: Boolean(fullName && !errors.full_name),
          })}
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
        )}
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
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
            />
          )}
        />
        <div className="mt-2 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  i < strength.score ? strengthColor : "#e5e7eb",
              }}
            />
          ))}
        </div>
        {password.length > 0 && (
          <p className="mt-1 text-xs" style={{ color: strengthColor }}>
            {STRENGTH_LABELS[strength.level]}
          </p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                req.met ? "text-green-600" : "text-gray-400"
              )}
            >
              {req.met ? (
                <CheckCircle size={12} className="shrink-0 text-green-500" />
              ) : (
                <Circle size={12} className="shrink-0 text-gray-300" />
              )}
              {req.label}
            </div>
          ))}
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={authLabelClass}>
          Confirm Password
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
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Controller
        name="terms"
        control={control}
        render={({ field }) => (
          <label className="group flex cursor-pointer items-start gap-3">
            <span className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded border-2 border-gray-300 transition-all duration-200",
                  "peer-checked:border-purple-600 peer-checked:bg-purple-600",
                  "peer-checked:[&_svg]:opacity-100",
                  errors.terms && "border-red-400"
                )}
              >
                <Check size={10} className="text-white opacity-0" />
              </span>
            </span>
            <span className="text-sm leading-relaxed text-gray-600">
              I agree to the{" "}
              <Link to="/" className="font-medium text-purple-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/" className="font-medium text-purple-600 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        )}
      />
      {errors.terms && (
        <p className="text-sm text-red-600">{errors.terms.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            Create Account
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

      <p className="text-center text-xs text-gray-400">
        By creating an account you agree to our terms. No credit card required for
        the 14-day Pro trial.
      </p>
    </form>
  )
}
