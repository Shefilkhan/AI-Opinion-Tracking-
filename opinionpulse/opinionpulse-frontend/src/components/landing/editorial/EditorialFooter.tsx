import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import { footerConnectLinks } from "@/data/landingEditorialData"

export function EditorialFooter() {
  const [email, setEmail] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const target = email.trim()
    if (!target) return
    window.location.href = `mailto:shefilpathan@gmail.com?subject=OpinionPulse%20updates&body=Please%20add%20${encodeURIComponent(target)}%20to%20updates.`
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="le-newsletter-input"
              aria-label="Email address"
            />
            <button type="submit" className="le-btn-solid shrink-0 px-8 py-3.5">
              Join now
            </button>
          </form>
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
