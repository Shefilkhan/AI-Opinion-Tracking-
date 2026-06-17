import { Link } from "react-router-dom"
import {
  Activity,
  Bot,
  Search,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react"
import { AuthDashboardVisual } from "@/components/auth/AuthDashboardVisual"
import "@/styles/landing-editorial.css"
import { cn } from "@/lib/utils"

export type AuthPanelVariant = "signup" | "signin" | "otp"

type AuthSplitLayoutProps = {
  variant: AuthPanelVariant
  children: React.ReactNode
  topLink?: { text: string; href: string; label: string }
}

const AVATAR_COLORS = ["#2f3a2f", "#5f665c", "#8a9a7a", "#c5cdb8"]

function LeftPanelContent({ variant }: { variant: AuthPanelVariant }) {
  if (variant === "otp") {
    return (
      <>
        <div className="auth-fade-in auth-delay-0 mb-12 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
            <Activity size={20} />
          </div>
          <span className="font-serif-display text-xl font-semibold text-[var(--le-text)]">
            OpinionPulse
          </span>
        </div>
        <div className="auth-fade-in auth-delay-100 le-auth-badge mb-4">
          <span className="le-auth-badge-dot" />
          Secure verification
        </div>
        <h1 className="auth-fade-in auth-delay-200 le-auth-heading mb-4">
          Check your
          <span className="block le-auth-accent">email inbox</span>
        </h1>
        <p className="auth-fade-in auth-delay-300 le-body mb-8 max-w-sm">
          We sent a 6-digit verification code to your email. It expires in 2 minutes.
        </p>
        <div className="auth-fade-in auth-delay-400 mb-8">
          <AuthDashboardVisual />
        </div>
        <div className="auth-fade-in auth-delay-400 flex items-start gap-2 rounded-xl border border-[var(--le-border)] bg-[var(--le-surface)] p-3">
          <Shield size={14} className="mt-0.5 shrink-0 text-[var(--le-forest)]" />
          <p className="text-xs leading-relaxed text-[var(--le-muted)]">
            Never share your OTP with anyone. OpinionPulse will never ask for it.
          </p>
        </div>
      </>
    )
  }

  const heading =
    variant === "signin" ? (
      <>
        Navigating the
        <span className="block le-auth-accent">public opinion landscape</span>
      </>
    ) : (
      <>
        Track what the
        <span className="block le-auth-accent">world thinks</span>
      </>
    )

  const subtext =
    variant === "signin"
      ? "Sign in to continue tracking public sentiment across 13 live data sources."
      : "Join researchers and analysts using OpinionPulse across Reddit, YouTube, Bluesky, Mastodon, GitHub, and more."

  return (
    <>
      <div className="flex flex-1 flex-col justify-center">
        <div className="auth-fade-in auth-delay-0 mb-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
            <Activity size={20} />
          </div>
          <span className="font-serif-display text-xl font-semibold text-[var(--le-text)]">
            OpinionPulse
          </span>
        </div>

        <div className="auth-fade-in auth-delay-100 le-auth-badge mb-4">
          <span className="le-auth-badge-dot" />
          AI-powered opinion intelligence
        </div>

        <h1 className="auth-fade-in auth-delay-200 le-auth-heading mb-4">{heading}</h1>

        <p className="auth-fade-in auth-delay-300 le-body mb-6 max-w-md">{subtext}</p>

        <div className="auth-fade-in auth-delay-400">
          <AuthDashboardVisual />
        </div>

        <div className="auth-fade-in auth-delay-500 mt-8 space-y-3">
          <div className="flex items-start gap-3">
            <div className="le-auth-feature-icon mt-0.5">
              <Search size={14} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--le-text)]">Search 13 live data sources</p>
              <p className="mt-0.5 text-xs text-[var(--le-muted)]">
                Reddit, YouTube, Bluesky, Mastodon, GitHub, Guardian, and more
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="le-auth-feature-icon mt-0.5">
              <Bot size={14} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--le-text)]">AI opinion analysis</p>
              <p className="mt-0.5 text-xs text-[var(--le-muted)]">
                Summaries, debate detection, and trend prediction
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="le-auth-feature-icon mt-0.5">
              <TrendingUp size={14} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--le-text)]">Real-time sentiment trends</p>
              <p className="mt-0.5 text-xs text-[var(--le-muted)]">
                Live charts, platform pulse, and keyword alerts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-fade-in auth-delay-500 border-t border-[var(--le-border)] pt-8">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["S", "A", "R", "M"].map((letter, i) => (
              <div
                key={letter}
                className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--le-sage-soft)] text-xs font-medium text-white"
                style={{ background: AVATAR_COLORS[i] }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--le-text)]">Join 500+ researchers</p>
            <div className="mt-0.5 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="fill-[var(--le-forest)] text-[var(--le-forest)]"
                />
              ))}
              <span className="ml-1 text-xs text-[var(--le-muted)]">4.9/5 rating</span>
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
  const showMobileVisual = variant === "signin" || variant === "signup"

  return (
    <div className="landing-editorial flex min-h-screen">
      <div
        className={cn(
          "le-auth-left relative hidden min-h-screen flex-col border-r border-[var(--le-border)]/40 bg-card/25 backdrop-blur-xl",
          "md:flex md:w-1/2 lg:w-[55%]"
        )}
      >
        <div className="flex min-h-screen flex-col px-10 py-12 lg:px-12 lg:py-14">
          <LeftPanelContent variant={variant} />
        </div>
      </div>

      <div className="le-auth-right flex min-h-screen w-full flex-col overflow-y-auto bg-card/45 backdrop-blur-xl border-l border-[var(--le-border)]/40 md:w-1/2 lg:w-[45%]">
        <div className="auth-slide-in mx-auto flex w-full max-w-md flex-col justify-center px-6 py-8 md:min-h-screen md:px-10 md:py-12 lg:px-12">
          <div className="mb-8 flex items-center justify-between gap-2 md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
                <Activity size={16} />
              </div>
              <span className="font-serif-display font-semibold text-[var(--le-text)]">
                OpinionPulse
              </span>
            </Link>
          </div>

          {showMobileVisual && (
            <div className="mb-8 md:hidden">
              <AuthDashboardVisual />
            </div>
          )}

          {topLink && (
            <div className="mb-8 flex justify-end">
              <p className="text-sm text-[var(--le-muted)]">
                {topLink.text}{" "}
                <Link to={topLink.href} className="le-auth-link">
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
