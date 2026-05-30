import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import { pageMesh } from "@/lib/ui-classes"
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
        "relative flex min-h-screen flex-col items-center justify-center px-4 py-12",
        pageMesh
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <Link
        to="/"
        className="relative mb-8 flex items-center gap-2.5 font-semibold text-white transition-opacity hover:opacity-90"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-900/40">
          <Activity className="size-4 text-white" />
        </span>
        OpinionPulse
      </Link>

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-500">
          {footerText}{" "}
          <Link
            to={footerLink}
            className="font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
