import { useState } from "react"
import { Link } from "react-router-dom"
import { pricingPlans } from "@/data/pricingData"
import { EditorialBillingToggle } from "@/components/landing/editorial/EditorialBillingToggle"
import {
  EditorialPricingCard,
  editorialPlanOrder,
} from "@/components/landing/editorial/EditorialPricingCard"
import { PlatformLogoMarquee } from "@/components/pricing/PlatformLogoMarquee"
import { cn } from "@/lib/utils"

type EditorialPricingSectionProps = {
  showBetaNote?: boolean
  showViewAllLink?: boolean
  compactFeatures?: boolean
  className?: string
}

export function EditorialPricingSection({
  showBetaNote = true,
  showViewAllLink = true,
  compactFeatures = true,
  className,
}: EditorialPricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className={cn("le-pricing-section", className)}>
      <div className="le-pricing-glow" aria-hidden />

      <div className="le-container relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <span className="le-auth-badge mb-4">Subscription plans</span>
            <h2 className="le-section-title mb-4 text-[var(--le-text)]">
              Purchase a subscription
            </h2>
            <p className="le-body max-w-sm">
              Choose the plan that fits your research, newsroom, or team. Start on Starter and
              upgrade when you need all 13 sources and AI insights.
            </p>
            {showViewAllLink && (
              <Link to="/pricing" className="le-auth-link mt-6 inline-block text-sm">
                View full plan comparison →
              </Link>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="le-pricing-panel">
              <div className="mb-8 text-center lg:text-left">
                <h3 className="font-serif-display text-2xl font-semibold text-[var(--le-text)]">
                  Choose your plan
                </h3>
                <p className="le-body mt-2">Flexible billing — switch or cancel anytime.</p>
                <div className="mt-6 flex justify-center lg:justify-start">
                  <EditorialBillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 md:gap-3 lg:gap-4">
                {pricingPlans.map((plan) => (
                  <div key={plan.id} className={editorialPlanOrder(plan.id)}>
                    <EditorialPricingCard plan={plan} isAnnual={isAnnual} compact={compactFeatures} />
                  </div>
                ))}
              </div>

              {showBetaNote && (
                <p className="mt-8 text-center text-sm text-[var(--le-muted)]">
                  Currently in beta — full features available during development. Paid billing
                  activates at launch.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-[var(--le-border)] pt-12">
          <PlatformLogoMarquee />
        </div>
      </div>
    </section>
  )
}
