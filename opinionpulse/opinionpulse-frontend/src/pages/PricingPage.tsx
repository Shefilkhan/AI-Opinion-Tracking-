import "@/styles/landing-editorial.css"
import { EditorialNavbar } from "@/components/landing/editorial/EditorialNavbar"
import { EditorialFooter } from "@/components/landing/editorial/EditorialFooter"
import { EditorialPricingSection } from "@/components/landing/editorial/EditorialPricingSection"
import { FAQAccordion } from "@/components/pricing/FAQAccordion"
import { TrustBadges } from "@/components/pricing/TrustBadges"
import { ComparisonTable } from "@/components/pricing/ComparisonTable"

export function PricingPage() {
  return (
    <div className="landing-editorial min-h-screen">
      <EditorialNavbar />

      <main className="pt-8">
        <EditorialPricingSection showViewAllLink={false} compactFeatures={false} className="pb-12" />

        <div className="le-container pb-16">
          <div className="le-pricing-panel">
            <ComparisonTable />
          </div>

          <div className="mt-12 border-t border-[var(--le-border)] pt-12">
            <FAQAccordion />
            <TrustBadges />
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  )
}
