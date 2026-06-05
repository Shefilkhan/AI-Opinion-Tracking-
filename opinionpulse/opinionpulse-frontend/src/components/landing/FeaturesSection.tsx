import { features } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Everything you need to understand public opinion
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Built for researchers, analysts, students, and curious minds
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <div
                  className={cn(
                    "group relative h-full rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    feature.highlighted
                      ? "border-2 border-purple-500/40 bg-white shadow-md ring-1 ring-purple-500/10"
                      : "border-gray-100 bg-white hover:border-purple-100"
                  )}
                >
                  {feature.highlighted && (
                    <span className="absolute right-4 top-4 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      ✨ Most Popular
                    </span>
                  )}
                  <div
                    className={cn(
                      "mb-4 flex size-12 items-center justify-center rounded-xl text-2xl",
                      feature.iconBg
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
