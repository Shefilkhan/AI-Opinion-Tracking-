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

      <main className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="landing-orb-purple absolute -left-32 top-24 size-96 opacity-40" />
          <div className="landing-orb-blue absolute -right-24 top-40 size-80 opacity-30" />
        </div>

        <section className="relative px-4 pb-8 pt-12 md:px-8 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-badge inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              Pricing
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Simple, Transparent{" "}
              <span className="text-gradient-brand">Pricing</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Start free. Scale as you grow. Cancel anytime — no questions asked.
            </p>
            <p className="mt-5">
              <Link
                to="/auth/signup?plan=pro"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Try Pro free for 14 days
                <span aria-hidden>→</span>
              </Link>
            </p>
          </div>
        </section>

        <section className="relative px-4 pb-20 md:px-8 md:pb-28">
          <div className="mx-auto max-w-7xl">
            <PricingPlansGrid />
          </div>
        </section>

        <div className="relative mx-auto max-w-7xl border-t border-border px-4 md:px-8">
          <FAQAccordion />
          <TrustBadges />
        </div>
      </main>

      <Footer />
    </div>
  )
}
