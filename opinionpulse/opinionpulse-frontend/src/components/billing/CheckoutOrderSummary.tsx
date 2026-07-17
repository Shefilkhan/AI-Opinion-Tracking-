import { Link } from "react-router-dom"
import { Activity, ArrowLeft } from "lucide-react"
import { EditorialBillingToggle } from "@/components/landing/editorial/EditorialBillingToggle"
import { planPrices, type PlanId, type PricingPlan } from "@/data/pricingData"
import { cn } from "@/lib/utils"

type CheckoutOrderSummaryProps = {
  plan: PricingPlan
  planId: PlanId
  isAnnual: boolean
  onBillingChange: (annual: boolean) => void
}

const planGradients: Record<PlanId, string> = {
  starter: "from-emerald-400 to-teal-500",
  pro: "from-violet-500 to-indigo-600",
  enterprise: "from-slate-700 to-slate-900",
}

export function CheckoutOrderSummary({
  plan,
  planId,
  isAnnual,
  onBillingChange,
}: CheckoutOrderSummaryProps) {
  const prices = planPrices[planId]
  const monthlyRate = isAnnual ? prices.annual : prices.monthly
  const totalDue = isAnnual ? prices.annualTotal : prices.monthly
  const billingLabel = isAnnual ? "year" : "month"

  return (
    <aside className="le-checkout-summary">
      <div className="le-checkout-summary-inner">
        <Link
          to="/pricing"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--le-muted)] transition-colors hover:text-[var(--le-text)]"
        >
          <ArrowLeft className="size-4" />
          All plans
        </Link>

        <Link to="/" className="mb-10 flex items-center gap-2 text-sm font-semibold text-[var(--le-text)]">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
            <Activity className="size-4" />
          </span>
          OpinionPulse
        </Link>

        <p className="text-sm text-[var(--le-muted)]">Subscribe to</p>
        <h1 className="font-serif-display mt-1 text-3xl font-semibold tracking-tight text-[var(--le-text)] md:text-4xl">
          OpinionPulse {plan.name}
        </h1>

        <div className="mt-8">
          <p className="font-serif-display text-4xl font-semibold tracking-tight text-[var(--le-text)]">
            ${totalDue.toFixed(2)}
            <span className="ml-1 text-lg font-normal text-[var(--le-muted)]">/{billingLabel}</span>
          </p>
          {isAnnual ? (
            <p className="mt-1 text-sm text-[var(--le-muted)]">
              ${monthlyRate.toFixed(2)} / month billed annually
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--le-muted)]">Billed monthly · cancel anytime</p>
          )}
        </div>

        <div className="mt-8 flex justify-start">
          <EditorialBillingToggle isAnnual={isAnnual} onChange={onBillingChange} />
        </div>

        <div className="mt-10 space-y-4 border-t border-[var(--le-border)] pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                  planGradients[planId]
                )}
              >
                {plan.name.charAt(0)}
              </span>
              <div>
                <p className="font-medium text-[var(--le-text)]">{plan.name}</p>
                <p className="mt-0.5 max-w-xs text-sm text-[var(--le-muted)]">{plan.tagline}</p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-medium text-[var(--le-text)]">
              ${totalDue.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-[var(--le-muted)]">
            <span>Subtotal</span>
            <span>${totalDue.toFixed(2)}</span>
          </div>

          <p className="text-xs text-[var(--le-muted)]">
            Promotion codes can be applied on the payment form.
          </p>

          <div className="flex items-center justify-between border-t border-[var(--le-border)] pt-4">
            <span className="font-medium text-[var(--le-text)]">Total due today</span>
            <span className="font-serif-display text-xl font-semibold text-[var(--le-text)]">
              ${totalDue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
