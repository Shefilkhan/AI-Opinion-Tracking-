import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import "@/styles/landing-editorial.css"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: React.ReactNode
  footerText: string
  footerLink: string
  footerLinkLabel: string
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkLabel,
}: AuthLayoutProps) {
  return (
    <div className="landing-editorial flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        to="/"
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-[var(--le-text)] transition-opacity hover:opacity-80"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
          <Activity className="size-4" />
        </span>
        OpinionPulse
      </Link>

      <div
        className={cn(
          "w-full max-w-[420px] rounded-2xl border border-[var(--le-border)] bg-[var(--le-surface)] p-8 shadow-sm"
        )}
      >
        <h1 className="le-auth-form-title">{title}</h1>
        <p className="le-auth-form-subtitle mt-2">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-[var(--le-muted)]">
          {footerText}{" "}
          <Link to={footerLink} className="le-auth-link">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
