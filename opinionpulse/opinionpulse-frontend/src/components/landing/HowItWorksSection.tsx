import { howItWorksSteps } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[var(--bg-secondary)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif-display text-3xl font-medium tracking-normal text-foreground md:text-4xl">
            How OpinionPulse Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From search to AI insight in under 3 seconds
          </p>
        </ScrollReveal>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dashed border-border md:block"
            aria-hidden
          />

          {howItWorksSteps.map((step, i) => (
            <ScrollReveal key={step.step} delay={i * 200} className="relative">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.step}
                </div>
                <span className="mb-2 text-2xl" aria-hidden>
                  {step.emoji}
                </span>
                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                <div className="mt-6 w-full max-w-[220px] rounded-xl border border-border bg-card p-4">
                  {i === 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <span className="text-primary">🔍</span>
                      Search &ldquo;climate policy&rdquo;...
                    </div>
                  )}
                  {i === 1 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {["R", "YT", "N", "HN"].map((p) => (
                        <span
                          key={p}
                          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-left text-[10px] text-primary">
                      🤖 Sentiment: deeply divided
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
