import { techStackItems } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function TechStackSection() {
  return (
    <section id="tech-stack" className="border-y border-border bg-[var(--bg-secondary)] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Built With
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modern, reliable, open-source technology
          </p>
        </ScrollReveal>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {techStackItems.map((item, i) => (
            <ScrollReveal key={item.name} delay={i * 50}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200",
                    item.highlighted
                      ? "bg-primary text-primary-foreground md:size-16 md:text-base"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {item.abbr}
                </div>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
