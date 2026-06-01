import { howItWorksSteps } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-gray-200 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="How It Works"
          title="Five steps to actionable insights"
          description="Set up a project in minutes and let OpinionPulse handle collection, analysis, and exploration."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {howItWorksSteps.map((step) => (
            <div
              key={step.step}
              className="relative rounded-lg border border-gray-200 bg-card p-5 shadow-[var(--shadow-subtle)]"
            >
              <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {step.step}
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
