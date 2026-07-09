import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Activity, Loader2 } from "lucide-react"
import { joinNewsletter } from "@/api/newsletter"
import { ApiError } from "@/api/client"
import { footerConnectLinks } from "@/data/landingEditorialData"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed)
}

export function EditorialFooter() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const emailValid = isValidEmail(email)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!emailValid) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      const res = await joinNewsletter(email)
      setSuccess(res.message)
      setEmail("")
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : "Something went wrong. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="border-t border-[var(--le-border)] py-16 md:py-20">
      <div className="le-container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="le-section-title mb-6">Connect with us</h2>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
                if (success) setSuccess(null)
              }}
              placeholder="Your email address"
              className="le-newsletter-input"
              aria-label="Email address"
              aria-invalid={email.length > 0 && !emailValid}
              disabled={loading}
            />
            <button
              type="submit"
              className="le-btn-solid shrink-0 px-8 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!emailValid || loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Joining…
                </span>
              ) : (
                "Join with us"
              )}
            </button>
          </form>
          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-3 text-sm text-[var(--le-forest)]" role="status">
              {success}
            </p>
          )}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-[var(--le-border)] pt-8 md:flex-row">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[var(--le-text)]">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
              <Activity className="size-4" />
            </span>
            OpinionPulse
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerConnectLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-xs text-[var(--le-muted)] transition-colors hover:text-[var(--le-text)]"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/pricing"
              className="text-xs text-[var(--le-muted)] transition-colors hover:text-[var(--le-text)]"
            >
              Pricing
            </Link>
          </div>

          <p className="text-xs text-[var(--le-muted)]">
            © {new Date().getFullYear()} OpinionPulse · Real-time public opinion intelligence
          </p>
        </div>
      </div>
    </footer>
  )
}
