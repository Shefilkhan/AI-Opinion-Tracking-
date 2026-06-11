import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid"

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-t border-border bg-[var(--bg-secondary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="font-serif-display mt-3 text-3xl font-medium tracking-normal text-foreground md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Starter, Pro, and Enterprise — built for researchers and teams.
          </p>
        </ScrollReveal>

        <div className="mt-12">
          <PricingPlansGrid showComparison={false} />
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            View full comparison &amp; FAQ
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
