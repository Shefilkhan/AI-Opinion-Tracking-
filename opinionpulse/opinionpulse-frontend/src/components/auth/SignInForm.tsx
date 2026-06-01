import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signInUser } from "@/api/auth"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInSchema, type SignInFormValues } from "@/lib/validations/auth"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function SignInForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/dashboard"

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

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
      {errors.root && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
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
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
            />
          )}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          to="/auth/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn("w-full min-h-11", btnPrimary)}
      >
        {isSubmitting ? "Please wait…" : "Sign In"}
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
