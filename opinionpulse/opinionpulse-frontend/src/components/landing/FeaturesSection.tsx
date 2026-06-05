import { features } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import {
  LandingContainer,
  LandingHeading,
  LandingLabel,
  LandingSubtext,
} from "@/components/landing/landingSection"
import { cn } from "@/lib/utils"

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24">
      <LandingContainer>
        <ScrollReveal className="text-center">
          <LandingLabel>Features</LandingLabel>
          <LandingHeading className="mx-auto max-w-[600px]">
            Everything you need to understand public opinion
          </LandingHeading>
          <LandingSubtext>
            Built for researchers, analysts, students, and curious minds
          </LandingSubtext>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <div
                  className={cn(
                    "group flex h-full min-h-[220px] flex-col rounded-2xl border border-gray-200 bg-white p-7",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-[250ms] ease-out",
                    "hover:-translate-y-1 hover:border-purple-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]"
                  )}
                >
                  <div
                    className={cn(
                      "mb-5 flex size-[52px] shrink-0 items-center justify-center rounded-[14px]",
                      feature.containerBg
                    )}
                  >
                    <Icon className={cn("size-6", feature.iconColor)} aria-hidden />
                  </div>
                  <h3 className="mb-2.5 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-[1.65] text-gray-500">{feature.description}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </LandingContainer>
    </section>
  )
}
