import { useState } from "react"
import { pricingPlans } from "@/data/pricingData"
import { BillingToggle } from "@/components/pricing/BillingToggle"
import { PricingCard } from "@/components/pricing/PricingCard"
import { ComparisonTable } from "@/components/pricing/ComparisonTable"

type PricingPlansGridProps = {
  showComparison?: boolean
  showBetaNote?: boolean
  className?: string
}

export function PricingPlansGrid({
  showComparison = true,
  showBetaNote = true,
  className,
}: PricingPlansGridProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  const orderClass = (id: string) => {
    if (id === "pro") return "order-1 lg:order-2"
    if (id === "starter") return "order-2 lg:order-1"
    return "order-3 lg:order-3"
  }

  return (
    <div className={className}>
      <div className="flex justify-center">
        <BillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
      </div>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-3 lg:gap-6">
        {pricingPlans.map((plan) => (
          <div key={plan.id} className={orderClass(plan.id)}>
            <PricingCard plan={plan} isAnnual={isAnnual} />
          </div>
        ))}
      </div>

      {showBetaNote && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          💡 Currently in beta — all features available free during development.
          Pricing activates at launch.
        </p>
      )}

      {showComparison && <ComparisonTable />}
    </div>
  )
}
