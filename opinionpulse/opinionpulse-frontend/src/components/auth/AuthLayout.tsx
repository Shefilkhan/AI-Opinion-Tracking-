import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import { cardSurface, pageShell, pageTitle } from "@/lib/ui-classes"
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
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center px-4 py-12",
        pageShell
      )}
    >
      <Link
        to="/"
        className="mb-8 flex items-center gap-2 text-sm font-medium text-foreground transition-opacity hover:opacity-80"
      >
        <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
          <Activity className="size-4" />
        </span>
        OpinionPulse
      </Link>

      <div className={cn("w-full max-w-[420px] p-8", cardSurface)}>
        <h1 className={pageTitle}>{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footerText}{" "}
          <Link to={footerLink} className="font-medium text-primary hover:underline">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
