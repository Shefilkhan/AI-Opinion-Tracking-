import { Link } from "react-router-dom"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { ParticleBackground } from "@/components/ui/ParticleBackground"
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid"
import { FAQAccordion } from "@/components/pricing/FAQAccordion"
import { TrustBadges } from "@/components/pricing/TrustBadges"

export function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/80 via-white to-white">
      <ParticleBackground sentiment="neutral" intensity={0.45} />
      <Navbar />

      <main className="relative z-10 pt-16">
        <section
          className="relative overflow-hidden px-4 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28"
          style={{
            background:
              "linear-gradient(to bottom, #020617 0%, rgba(88,28,135,0.2) 40%, transparent 100%)",
          }}
        >
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
              Pricing
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
              Start free. Scale as you grow. Cancel anytime — no questions asked.
            </p>
            <p className="mt-6">
              <Link
                to="/auth/signup?plan=pro"
                className="text-sm font-medium text-purple-300 hover:text-purple-200 hover:underline"
              >
                Try Pro free for 14 days →
              </Link>
            </p>
          </div>
        </section>

        <section className="relative -mt-8 px-4 pb-24 md:px-8">
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
