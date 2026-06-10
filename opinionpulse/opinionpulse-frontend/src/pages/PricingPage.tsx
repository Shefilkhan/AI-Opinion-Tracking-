import { Link } from "react-router-dom"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid"
import { FAQAccordion } from "@/components/pricing/FAQAccordion"
import { TrustBadges } from "@/components/pricing/TrustBadges"

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-16">
        <section className="px-4 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Pricing
            </p>
            <h1 className="font-serif-display mt-4 text-4xl font-medium tracking-normal text-foreground md:text-5xl lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Start free. Scale as you grow. Cancel anytime — no questions asked.
            </p>
            <p className="mt-6">
              <Link
                to="/auth/signup?plan=pro"
                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
              >
                Try Pro free for 14 days →
              </Link>
            </p>
          </div>
        </section>

        <section className="px-4 pb-24 md:px-8">
          <div className="mx-auto max-w-7xl">
            <PricingPlansGrid />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <FAQAccordion />
          <TrustBadges />
        </div>
      </main>

      <Footer />
    </div>
  )
}
