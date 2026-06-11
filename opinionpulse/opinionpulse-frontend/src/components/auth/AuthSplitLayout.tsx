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
import { pageShell } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export type AuthPanelVariant = "signup" | "signin" | "otp"

type AuthSplitLayoutProps = {
  variant: AuthPanelVariant
  children: React.ReactNode
  topLink?: { text: string; href: string; label: string }
}

const AVATAR_COLORS = [
  "var(--primary)",
  "var(--accent-foreground)",
  "var(--success)",
  "var(--muted-foreground)",
]

function LeftPanelContent({ variant }: { variant: AuthPanelVariant }) {
  if (variant === "otp") {
    return (
      <>
        <div className="auth-fade-in auth-delay-0 mb-16 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground">
            <Activity size={20} />
          </div>
          <span className="font-serif-display text-xl font-medium text-foreground">
            OpinionPulse
          </span>
        </div>
        <div className="auth-fade-in auth-delay-100 mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          Secure verification
        </div>
        <h1 className="auth-fade-in auth-delay-200 font-serif-display mb-4 text-4xl font-medium leading-tight text-foreground">
          Check Your
          <span className="block text-primary">Email Inbox</span>
        </h1>
        <p className="auth-fade-in auth-delay-300 mb-8 max-w-sm text-base leading-relaxed text-muted-foreground">
          We sent a 6-digit verification code to your email. It expires in 2 minutes.
        </p>
        <div className="auth-fade-in auth-delay-300 mb-8 flex size-20 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-card">
          <Mail size={36} className="text-primary" />
        </div>
        <div className="auth-fade-in auth-delay-400 flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-accent p-3">
          <Shield size={14} className="mt-0.5 shrink-0 text-accent-foreground" />
          <p className="text-xs leading-relaxed text-accent-foreground">
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
        <span className="block text-primary">Back</span>
      </>
    ) : (
      <>
        Track What The
        <span className="block text-primary">World Thinks</span>
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
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground">
            <Activity size={20} />
          </div>
          <span className="font-serif-display text-xl font-medium text-foreground">
            OpinionPulse
          </span>
        </div>

        <div className="auth-fade-in auth-delay-100 mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          AI-Powered Opinion Intelligence
        </div>

        <h1 className="auth-fade-in auth-delay-200 font-serif-display mb-4 text-4xl font-medium leading-tight text-foreground">
          {heading}
        </h1>

        <p className="auth-fade-in auth-delay-300 mb-10 max-w-sm text-base leading-relaxed text-muted-foreground">
          {subtext}
        </p>

        <div className="auth-fade-in auth-delay-400 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-card">
              <Search size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Search 10 Live Data Sources</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reddit, YouTube, Guardian, NewsAPI and more
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-card">
              <Bot size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Opinion Analysis</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Powered by Claude — summaries, debates, predictions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-card">
              <TrendingUp size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Real-Time Sentiment Trends</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Live charts, debate detection, trend prediction
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-fade-in auth-delay-500 border-t border-border pt-10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["S", "A", "R", "M"].map((letter, i) => (
              <div
                key={letter}
                className="flex size-8 items-center justify-center rounded-full border-2 border-background text-xs font-medium text-primary-foreground"
                style={{ background: AVATAR_COLORS[i] }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Join 500+ researchers</p>
            <div className="mt-0.5 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="fill-primary text-primary"
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">4.9/5 rating</span>
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
    <div className={cn("flex min-h-screen", pageShell)}>
      <div
        className={cn(
          "relative hidden min-h-screen flex-col border-r border-border bg-muted/40",
          "md:flex md:w-1/2 lg:w-[55%]"
        )}
      >
        <div className="flex min-h-screen flex-col px-10 py-12 lg:px-12 lg:py-[60px]">
          <LeftPanelContent variant={variant} />
        </div>
      </div>

      <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-background md:w-1/2 lg:w-[45%]">
        <div className="auth-slide-in mx-auto flex w-full max-w-md flex-col justify-center px-6 py-8 md:min-h-screen md:px-10 md:py-12 lg:px-12">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
              <Activity size={16} />
            </div>
            <span className="font-serif-display font-medium text-foreground">OpinionPulse</span>
          </div>

          {topLink && (
            <div className="mb-8 flex justify-end">
              <p className="text-sm text-muted-foreground">
                {topLink.text}{" "}
                <Link
                  to={topLink.href}
                  className="font-medium text-primary hover:underline"
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
