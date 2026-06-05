import { Link } from "react-router-dom"
import {
  Activity,
  Bot,
  Mail,
  Search,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react"
import { ParticleBackground } from "@/components/ui/ParticleBackground"
import { cn } from "@/lib/utils"

export type AuthPanelVariant = "signup" | "signin" | "otp"

type AuthSplitLayoutProps = {
  variant: AuthPanelVariant
  children: React.ReactNode
  topLink?: { text: string; href: string; label: string }
}

const AVATAR_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b"]

function LeftPanelContent({ variant }: { variant: AuthPanelVariant }) {
  if (variant === "otp") {
    return (
      <>
        <div className="auth-fade-in auth-delay-0 mb-16 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">OpinionPulse</span>
        </div>
        <div className="auth-fade-in auth-delay-100 mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-purple-400" />
          Secure verification
        </div>
        <h1 className="auth-fade-in auth-delay-200 mb-4 text-4xl font-bold leading-tight text-white">
          Check Your
          <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Email Inbox
          </span>
        </h1>
        <p className="auth-fade-in auth-delay-300 mb-8 max-w-sm text-base leading-relaxed text-gray-400">
          We sent a 6-digit verification code to your email. It expires in 2 minutes.
        </p>
        <div className="auth-fade-in auth-delay-300 mb-8 flex size-20 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/20">
          <Mail size={36} className="text-purple-400" />
        </div>
        <div className="auth-fade-in auth-delay-400 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
          <Shield size={14} className="mt-0.5 shrink-0 text-yellow-400" />
          <p className="text-xs leading-relaxed text-yellow-300/80">
            Never share your OTP with anyone. OpinionPulse will never ask for it.
          </p>
        </div>
      </>
    )
  }

  const heading =
    variant === "signin" ? (
      <>
        Welcome
        <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Back
        </span>
      </>
    ) : (
      <>
        Track What The
        <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          World Thinks
        </span>
      </>
    )

  const subtext =
    variant === "signin"
      ? "Sign in to continue tracking public sentiment across 10 live data sources."
      : "Join thousands of researchers and analysts using OpinionPulse to track public sentiment across Reddit, YouTube, NewsAPI, and 7 more sources."

  return (
    <>
      <div className="flex flex-1 flex-col justify-center">
        <div className="auth-fade-in auth-delay-0 mb-16 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">OpinionPulse</span>
        </div>

        <div className="auth-fade-in auth-delay-100 mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-purple-400" />
          AI-Powered Opinion Intelligence
        </div>

        <h1 className="auth-fade-in auth-delay-200 mb-4 text-4xl font-bold leading-tight text-white">
          {heading}
        </h1>

        <p className="auth-fade-in auth-delay-300 mb-10 max-w-sm text-base leading-relaxed text-gray-400">
          {subtext}
        </p>

        <div className="auth-fade-in auth-delay-400 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/20">
              <Search size={14} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Search 10 Live Data Sources</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Reddit, YouTube, Guardian, NewsAPI and more
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/20">
              <Bot size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AI Opinion Analysis</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Powered by Claude — summaries, debates, predictions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-green-500/30 bg-green-500/20">
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Real-Time Sentiment Trends</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Live charts, debate detection, trend prediction
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-fade-in auth-delay-500 border-t border-white/10 pt-10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["S", "A", "R", "M"].map((letter, i) => (
              <div
                key={letter}
                className="flex size-8 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-bold text-white"
                style={{ background: AVATAR_COLORS[i] }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-white">Join 500+ researchers</p>
            <div className="mt-0.5 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-1 text-xs text-gray-400">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function AuthSplitLayout({
  variant,
  children,
  topLink,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          "relative hidden min-h-screen flex-col",
          "bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950",
          "md:flex md:w-1/2 lg:w-[55%]"
        )}
      >
        <ParticleBackground sentiment="neutral" intensity={0.5} />
        <div className="relative z-10 flex min-h-screen flex-col px-10 py-12 lg:px-12 lg:py-[60px]">
          <LeftPanelContent variant={variant} />
        </div>
      </div>

      <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-white md:w-1/2 lg:w-[45%]">
        <div className="auth-slide-in mx-auto flex w-full max-w-md flex-col justify-center px-6 py-8 md:min-h-screen md:px-10 md:py-12 lg:px-12">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-600">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">OpinionPulse</span>
          </div>

          {topLink && (
            <div className="mb-8 flex justify-end">
              <p className="text-sm text-gray-500">
                {topLink.text}{" "}
                <Link
                  to={topLink.href}
                  className="font-medium text-purple-600 hover:underline"
                >
                  {topLink.label}
                </Link>
              </p>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
