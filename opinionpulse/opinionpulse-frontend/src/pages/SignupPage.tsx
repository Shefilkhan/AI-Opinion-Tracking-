import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ApiError } from "@/api/client"
import { registerUser } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      navigate(`/verify-register-otp?email=${encodeURIComponent(res.email)}`, {
        state: { devOtpCode: res.dev_otp_code ?? undefined },
      })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Signup failed. Try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking public opinion with OpinionPulse."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkLabel="Log in"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground" htmlFor="name">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputSurface}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputSurface}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputSurface}
            required
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm text-muted-foreground"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={inputSurface}
            required
          />
        </div>
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={loading}
          className={cn("w-full", btnPrimary)}
        >
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-muted-foreground">
          Back to home
        </Link>
      </p>
    </AuthLayout>
  )
}
