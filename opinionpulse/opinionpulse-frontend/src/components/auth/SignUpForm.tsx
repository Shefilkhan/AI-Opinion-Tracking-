import { useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Check, CheckCircle, Circle, Loader2 } from "lucide-react"
import { ApiError } from "@/api/client"
import { signUpUser } from "@/api/auth"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasswordInput } from "@/components/auth/PasswordInput"
import {
  authInputClass,
  authLabelClass,
  STRENGTH_HEX,
  STRENGTH_LABELS,
} from "@/lib/auth/authUi"
import {
  getPasswordRequirements,
  getPasswordStrength,
} from "@/lib/auth/passwordStrength"
import { signUpSchema, type SignUpFormValues } from "@/lib/validations/auth"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function SignUpForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/dashboard"
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
        `/auth/verify-otp?email=${encodeURIComponent(res.email)}&type=signup`
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
          className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      )}

      <div className="mb-8">
        <h2 className="font-serif-display mb-1 text-2xl font-medium text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
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
          <p className="mt-1 text-sm text-destructive">{errors.full_name.message}</p>
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
                  i < strength.score ? strengthColor : "var(--border)",
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
                req.met ? "text-success" : "text-muted-foreground"
              )}
            >
              {req.met ? (
                <CheckCircle size={12} className="shrink-0 text-success" />
              ) : (
                <Circle size={12} className="shrink-0 text-border" />
              )}
              {req.label}
            </div>
          ))}
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
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
          <p className="mt-1 text-sm text-destructive">
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
                  "flex size-4 items-center justify-center rounded border-2 border-border transition-all duration-200",
                  "peer-checked:border-primary peer-checked:bg-primary",
                  "peer-checked:[&_svg]:opacity-100",
                  errors.terms && "border-destructive"
                )}
              >
                <Check size={10} className="text-primary-foreground opacity-0" />
              </span>
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link to="/" className="font-medium text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        )}
      />
      {errors.terms && (
        <p className="text-sm text-destructive">{errors.terms.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={cn(
          "flex w-full min-h-11 items-center justify-center gap-2 px-6 py-3 text-sm font-medium",
          btnPrimary,
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
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
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton redirect={redirect} />

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our terms. No credit card required for
        the 14-day Pro trial.
      </p>
    </form>
  )
}
