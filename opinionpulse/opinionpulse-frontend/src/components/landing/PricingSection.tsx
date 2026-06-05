import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid"

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-t border-gray-100 bg-gradient-to-b from-purple-50/80 via-white to-white py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Starter, Pro, and Enterprise — built for researchers and teams.
          </p>
        </ScrollReveal>

        <div className="mt-12">
          <PricingPlansGrid showComparison={false} />
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
          >
            View full comparison &amp; FAQ
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
