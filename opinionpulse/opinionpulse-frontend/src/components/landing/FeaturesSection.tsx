import { features } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="font-serif-display mt-3 text-3xl font-medium tracking-normal text-foreground md:text-4xl">
            Everything you need to understand public opinion
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
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
                    "group relative h-full rounded-2xl border p-8 transition-colors duration-300",
                    feature.highlighted
                      ? "border-2 border-primary/30 bg-card"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  {feature.highlighted && (
                    <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
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
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
