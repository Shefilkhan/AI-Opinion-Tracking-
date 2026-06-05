import { techStackItems } from "@/data/landingData"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function TechStackSection() {
  return (
    <section id="tech-stack" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Built With
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Modern, reliable, open-source technology
          </p>
        </ScrollReveal>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {techStackItems.map((item, i) => (
            <ScrollReveal key={item.name} delay={i * 50}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 hover:scale-110",
                    item.highlighted
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 md:size-16 md:text-base"
                      : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700"
                  )}
                >
                  {item.abbr}
                </div>
                <span className="text-xs text-gray-500">{item.name}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
