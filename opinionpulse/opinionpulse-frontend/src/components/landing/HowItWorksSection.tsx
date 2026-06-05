import { howItWorksSteps } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#F9FAFB] py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            How OpinionPulse Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From search to AI insight in under 3 seconds
          </p>
        </ScrollReveal>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dashed border-purple-200 md:block"
            aria-hidden
          />

          {howItWorksSteps.map((step, i) => (
            <ScrollReveal key={step.step} delay={i * 200} className="relative">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-500/30">
                  {step.step}
                </div>
                <span className="mb-2 text-2xl" aria-hidden>
                  {step.emoji}
                </span>
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>

                <div className="mt-6 w-full max-w-[220px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  {i === 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      <span className="text-purple-500">🔍</span>
                      Search &ldquo;climate policy&rdquo;...
                    </div>
                  )}
                  {i === 1 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {["R", "YT", "N", "HN"].map((p) => (
                        <span
                          key={p}
                          className="flex size-8 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 text-left text-[10px] text-purple-800">
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
