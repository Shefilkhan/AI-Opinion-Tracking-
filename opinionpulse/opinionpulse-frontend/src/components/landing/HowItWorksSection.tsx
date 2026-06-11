import { ChevronRight } from "lucide-react"
import { howItWorksSteps } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import {
  LandingContainer,
  LandingHeading,
  LandingLabel,
  LandingSubtext,
} from "@/components/landing/landingSection"
import GlowCard from "@/components/ui/GlowCard"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20">
      <LandingContainer>
        <ScrollReveal className="text-center">
          <LandingLabel>How It Works</LandingLabel>
          <LandingHeading>How OpinionPulse Works</LandingHeading>
          <LandingSubtext>From search to AI insight in under 3 seconds</LandingSubtext>
        </ScrollReveal>

        <div className="cards-grid mx-auto mt-12 grid max-w-[900px] grid-cols-1 gap-8 md:grid-cols-3">
          {howItWorksSteps.map((step, i) => (
            <ScrollReveal key={step.step} delay={i * 150} className="relative">
              <GlowCard
                glowColor="124, 58, 237"
                className="relative h-full p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-full bg-purple-600 text-base font-bold text-white">
                  {step.step}
                </div>
                <span className="mb-4 block text-4xl" aria-hidden>
                  {step.emoji}
                </span>
                <h3 className="mb-2.5 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm leading-[1.65] text-gray-500">{step.description}</p>
              </GlowCard>

              {i < howItWorksSteps.length - 1 && (
                <ChevronRight
                  className="pointer-events-none absolute -right-5 top-1/2 hidden size-6 -translate-y-1/2 text-purple-300 md:block"
                  aria-hidden
                />
              )}
            </ScrollReveal>
          ))}
        </div>
      </LandingContainer>
    </section>
  )
}
