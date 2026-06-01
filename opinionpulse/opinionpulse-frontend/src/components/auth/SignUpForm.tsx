import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiError } from "@/api/client"
import { signUpUser } from "@/api/auth"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getPasswordRequirements,
  getPasswordStrength,
  STRENGTH_COLORS,
} from "@/lib/auth/passwordStrength"
import { signUpSchema, type SignUpFormValues } from "@/lib/validations/auth"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      )}

      <div>
        <label htmlFor="full_name" className="mb-1.5 block text-sm text-muted-foreground">
          Full Name
        </label>
        <Input
          id="full_name"
          placeholder="John Doe"
          className={inputSurface}
          aria-invalid={Boolean(errors.full_name)}
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-muted-foreground">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          className={inputSurface}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-muted-foreground">
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
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm text-muted-foreground"
        >
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

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-gray-300"
          {...register("terms")}
        />
        <span>
          I agree to the{" "}
          <Link to="/" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {errors.terms && (
        <p className="text-sm text-destructive">{errors.terms.message}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={cn("w-full min-h-11", btnPrimary)}
      >
        {isSubmitting ? "Please wait…" : "Create Account"}
      </Button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <p className="relative bg-white px-2 text-center text-xs text-muted-foreground">
          — or continue with —
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full min-h-11"
        disabled
        title="Google OAuth — coming soon"
      >
        Continue with Google (TODO)
      </Button>
    </form>
  )
}
