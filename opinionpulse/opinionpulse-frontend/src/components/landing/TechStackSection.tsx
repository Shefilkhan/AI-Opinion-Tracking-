import { techStackItems } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import {
  LandingContainer,
  LandingLabel,
  LandingSubtext,
} from "@/components/landing/landingSection"

export function TechStackSection() {
  return (
    <section id="tech-stack" className="bg-gray-50 py-16">
      <LandingContainer>
        <ScrollReveal className="text-center">
          <LandingLabel>Built With</LandingLabel>
          <LandingSubtext className="mt-0">
            Modern, reliable, open-source technology
          </LandingSubtext>
        </ScrollReveal>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {techStackItems.map((item, i) => (
            <ScrollReveal key={item.name} delay={i * 40}>
              <div
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:scale-[1.04] hover:border-purple-300 hover:bg-purple-50"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.dotColor }}
                  aria-hidden
                />
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </LandingContainer>
    </section>
  )
}
