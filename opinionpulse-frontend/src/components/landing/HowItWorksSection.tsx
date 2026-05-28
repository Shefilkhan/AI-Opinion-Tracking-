import { howItWorksSteps } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-slate-800/50 bg-slate-900/30 py-16 md:py-24">
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
              className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg"
            >
              <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
                {step.step}
              </div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
