import { socialProofCards } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { LandingContainer } from "@/components/landing/landingSection"

export function SocialProofSection() {
  return (
    <section
      className="py-20"
      style={{
        background:
          "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)",
      }}
    >
      <LandingContainer>
        <ScrollReveal className="text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-white">
            Designed for Research &amp; Analysis
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-base text-white/65">
            Built with academic rigor for real-world impact
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {socialProofCards.map((card, i) => {
            const Icon = card.icon
            return (
              <ScrollReveal key={card.title} delay={i * 100}>
                <div className="h-full rounded-2xl border border-white/15 bg-white/[0.08] p-7 backdrop-blur-md transition-all duration-[250ms] ease-out hover:bg-white/[0.12]">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="size-5 text-white" aria-hidden />
                  </div>
                  <h3 className="mb-2.5 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="text-sm leading-[1.65] text-white/70">{card.description}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </LandingContainer>
    </section>
  )
}
