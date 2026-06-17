import { Link } from "react-router-dom"
import { ArrowRight, Check, LogIn } from "lucide-react"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-muted/30 py-24 dark:bg-white/[0.02]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-orb-purple absolute -left-20 top-10 size-72 opacity-40" />
        <div className="landing-orb-blue absolute -right-16 bottom-10 size-64 opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal delay={0}>
            <div className="landing-badge mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
              <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
              Start for free today
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h2 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">
              Start Tracking Opinion
              <span className="mt-1 block text-gradient-brand">In Real Time</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
              Join researchers and analysts using OpinionPulse to track what the
              world thinks — powered by 10 live data sources and AI analysis.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/auth/signup"
                className="btn-gradient flex w-full items-center justify-center gap-2 px-8 py-4 text-base font-semibold sm:w-auto"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/auth/signin"
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-medium text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-muted/50 sm:w-auto",
                  "dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                Sign In
                <LogIn size={18} />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                "No credit card required",
                "10 free data sources",
                "AI analysis included",
                "Built for researchers",
              ].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check size={14} className="text-success" />
                  {text}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <p className="mb-1 text-2xl font-bold text-foreground">10+</p>
                <p className="text-sm text-muted-foreground">Live data sources</p>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">AI features built-in</p>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Free to get started</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
