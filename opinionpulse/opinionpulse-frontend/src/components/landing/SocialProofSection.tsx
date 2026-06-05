import { socialProofCards } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"

export function SocialProofSection() {
  return (
    <section className="bg-gradient-to-br from-purple-900 to-indigo-900 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Designed for Research &amp; Analysis
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {socialProofCards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 100}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <span className="text-2xl" aria-hidden>
                  {card.emoji}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-purple-100/90">
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
