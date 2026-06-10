import { socialProofCards } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"

export function SocialProofSection() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif-display text-3xl font-medium tracking-normal text-foreground md:text-4xl">
            Designed for Research &amp; Analysis
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {socialProofCards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 100}>
              <div className="h-full rounded-2xl border border-border bg-card p-8">
                <span className="text-2xl" aria-hidden>
                  {card.emoji}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
