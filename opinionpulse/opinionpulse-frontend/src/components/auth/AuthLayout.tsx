import { Link } from "react-router-dom"
import { Activity } from "lucide-react"

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <Link
        to="/"
        className="mb-8 flex items-center gap-2 font-semibold text-white"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
          <Activity className="size-4 text-white" />
        </span>
        OpinionPulse
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-500">
          {footerText}{" "}
          <Link to={footerLink} className="text-blue-400 hover:text-blue-300">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
