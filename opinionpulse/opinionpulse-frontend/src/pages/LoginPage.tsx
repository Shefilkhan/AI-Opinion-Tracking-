import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ApiError } from "@/api/client"
import { loginUser } from "@/api/auth"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("Email and password are required.")
      return
    }

    setLoading(true)
    try {
      const res = await loginUser({ email: email.trim(), password })
      const mail = encodeURIComponent(res.email)
      if (res.requires_email_verification) {
        navigate(`/verify-register-otp?email=${mail}`)
        return
      }
      if (res.requires_login_otp) {
        navigate(`/verify-login-otp?email=${mail}`)
        return
      }
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Login failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to access your OpinionPulse dashboard."
      footerText="Don't have an account?"
      footerLink="/signup"
      footerLinkLabel="Sign up"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? "Logging in…" : "Log in"}
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
