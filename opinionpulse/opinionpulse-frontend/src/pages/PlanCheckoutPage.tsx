import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import "@/styles/landing-editorial.css"
import { EditorialNavbar } from "@/components/landing/editorial/EditorialNavbar"
import { EditorialFooter } from "@/components/landing/editorial/EditorialFooter"
import { EditorialBillingToggle } from "@/components/landing/editorial/EditorialBillingToggle"
import {
  EditorialPricingCard,
  editorialPlanOrder,
} from "@/components/landing/editorial/EditorialPricingCard"
import { PlatformLogoMarquee } from "@/components/pricing/PlatformLogoMarquee"
import { planPrices, pricingPlans, type PlanId } from "@/data/pricingData"
import { cn } from "@/lib/utils"

const VALID_PLANS: PlanId[] = ["starter", "pro", "enterprise"]

function isPlanId(value: string | undefined): value is PlanId {
  return VALID_PLANS.includes(value as PlanId)
}

export function PlanCheckoutPage() {
  const { planId } = useParams<{ planId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialAnnual = searchParams.get("billing") === "annual"
  const [isAnnual, setIsAnnual] = useState(initialAnnual)

  const plan = useMemo(
    () => pricingPlans.find((item) => item.id === planId),
    [planId]
  )

  useEffect(() => {
    const billing = isAnnual ? "annual" : "monthly"
    const current = searchParams.get("billing") ?? "monthly"
    if (current !== billing && planId) {
      navigate(`/pricing/${planId}?billing=${billing}`, { replace: true })
    }
  }, [isAnnual, navigate, planId, searchParams])

  if (!isPlanId(planId) || !plan) {
    return <Navigate to="/pricing" replace />
  }

  const prices = planPrices[plan.id]
  const amount = isAnnual ? prices.annual : prices.monthly

  return (
    <div className="landing-editorial min-h-screen">
      <EditorialNavbar />

      <main className="pb-8 pt-10">
        <div className="le-container">
          <Link
            to="/pricing"
            className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--le-muted)] transition-colors hover:text-[var(--le-text)]"
          >
            <ArrowLeft className="size-4" />
            Back to all plans
          </Link>

          <div className="mx-auto max-w-3xl text-center">
            <span className="le-auth-badge mb-4">Selected plan</span>
            <h1 className="font-serif-display text-4xl font-semibold tracking-tight text-[var(--le-text)] md:text-5xl">
              {plan.id === "pro" ? "Track like a Pro." : `Start with ${plan.name}.`}
            </h1>
            <p className="le-body mx-auto mt-4 max-w-xl">
              {plan.id === "enterprise"
                ? "Get advanced security, team workspaces, and dedicated support for your organization."
                : `Get full access from only $${(amount / 30).toFixed(2)} per day — cancel anytime.`}
            </p>

            <div className="mt-8 flex justify-center">
              <EditorialBillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
            </div>
            {isAnnual && (
              <p className="mt-3 text-sm font-medium text-[var(--le-forest)]">
                Save 20% on a yearly subscription.
              </p>
            )}
          </div>

          <div className="mx-auto mt-10 max-w-6xl">
            <div className="le-pricing-panel">
              <p className="mb-6 text-center text-sm text-[var(--le-muted)]">
                Compare all plans below — your selection is highlighted.
              </p>
              <div className="grid gap-4 md:grid-cols-3 md:gap-3 lg:gap-4">
                {pricingPlans.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/pricing/${item.id}?billing=${isAnnual ? "annual" : "monthly"}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        navigate(`/pricing/${item.id}?billing=${isAnnual ? "annual" : "monthly"}`)
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-[1.25rem] transition-transform hover:scale-[1.01]",
                      editorialPlanOrder(item.id)
                    )}
                  >
                    <EditorialPricingCard
                      plan={item}
                      isAnnual={isAnnual}
                      compact={false}
                      selected={item.id === planId}
                      mode="checkout"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-[var(--le-border)] pt-12">
          <PlatformLogoMarquee />
        </div>
      </main>

      <EditorialFooter />
    </div>
  )
}
