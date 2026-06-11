import { Link } from "react-router-dom"
import { ArrowRight, Check, LogIn } from "lucide-react"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { ParticleBackground } from "@/components/ui/ParticleBackground"

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 py-24">
      <ParticleBackground sentiment="positive" intensity={0.4} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto max-w-3xl">
        <ScrollReveal delay={0}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5 text-sm font-medium text-purple-300">
            <span className="inline-block size-2 animate-pulse rounded-full bg-purple-400" />
            Start for free today
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
            Start Tracking Opinion
            <span className="mt-1 block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              In Real Time
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-300">
            Join researchers and analysts using OpinionPulse to track what the
            world thinks — powered by 10 live data sources and AI analysis.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/auth/signup"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:bg-purple-500 hover:shadow-purple-500/50 sm:w-auto"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/auth/signin"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-medium text-white/80 transition-all duration-200 hover:border-white/40 hover:bg-white/5 hover:text-white sm:w-auto"
            >
              Sign In
              <LogIn size={18} />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {[
              "No credit card required",
              "10 free data sources",
              "AI analysis included",
              "Built for researchers",
            ].map((text) => (
              <span key={text} className="flex items-center gap-1.5">
                <Check size={14} className="text-green-400" />
                {text}
              </span>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <div>
              <p className="mb-1 text-2xl font-bold text-white">10+</p>
              <p className="text-sm text-gray-400">Live data sources</p>
            </div>
            <div>
              <p className="mb-1 text-2xl font-bold text-white">3</p>
              <p className="text-sm text-gray-400">AI features built-in</p>
            </div>
            <div>
              <p className="mb-1 text-2xl font-bold text-white">100%</p>
              <p className="text-sm text-gray-400">Free to get started</p>
            </div>
          </div>
        </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
