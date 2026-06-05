import { Link } from "react-router-dom"
import { Check, X } from "lucide-react"
import type { PlanId, PricingPlan } from "@/data/pricingData"
import { planPrices, ENTERPRISE_EMAIL } from "@/data/pricingData"
import { saveSelectedPlan } from "@/lib/planStorage"
import { cn } from "@/lib/utils"

type PricingCardProps = {
  plan: PricingPlan
  isAnnual: boolean
}

function PriceDisplay({ planId, isAnnual }: { planId: PlanId; isAnnual: boolean }) {
  const p = planPrices[planId]
  const amount = isAnnual ? p.annual : p.monthly

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1">
        <span
          key={`${planId}-${isAnnual}`}
          className="text-5xl font-bold tracking-tight text-gray-900 transition-all duration-300"
        >
          ${amount}
        </span>
        <span className="mb-2 text-lg text-gray-500">/mo</span>
      </div>
      {isAnnual && (
        <p className="mt-1 text-sm text-gray-400">
          billed ${p.annualTotal}/year
        </p>
      )}
    </div>
  )
}

export function PricingCard({ plan, isAnnual }: PricingCardProps) {
  const isPro = plan.highlighted
  const isEnterprise = plan.id === "enterprise"

  function handleCta() {
    if (plan.ctaMailto) return
    saveSelectedPlan(plan.id)
  }

  const ctaEl = plan.ctaMailto ? (
    <a
      href={ENTERPRISE_EMAIL}
      className={cn(
        "mt-8 flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300",
        "bg-gray-900 text-white hover:bg-gray-700 hover:shadow-lg"
      )}
    >
      {plan.cta}
    </a>
  ) : (
    <Link
      to={`/auth/signup?plan=${plan.id}`}
      onClick={handleCta}
      className={cn(
        "mt-8 flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300",
        plan.ctaVariant === "gradient" &&
          "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-300",
        plan.ctaVariant === "outline" &&
          "border-2 border-gray-300 bg-white text-gray-900 hover:border-purple-500 hover:text-purple-600",
        plan.ctaVariant === "dark" &&
          "bg-gray-900 text-white hover:bg-gray-700"
      )}
    >
      {plan.cta}
    </Link>
  )

  return (
    <div
      className={cn(
        "relative flex h-full flex-col",
        isPro && "md:-mt-4 md:mb-4"
      )}
    >
      {plan.badge && plan.badgePosition === "top" && (
        <div className="mb-3 flex justify-center">
          <span className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-sm font-semibold text-white shadow-md">
            {plan.badge}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex h-full flex-col rounded-[20px] bg-white p-8 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isPro
            ? "border-2 border-transparent bg-white shadow-xl shadow-purple-200/60 md:scale-105 [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#7c3aed,#3b82f6)_border-box] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-200"
            : "border border-gray-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl",
          isEnterprise && "hover:border-gray-400"
        )}
      >
        {plan.badge && plan.badgePosition === "corner" && (
          <span className="absolute right-6 top-6 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {plan.badge}
          </span>
        )}

        <h3
          className={cn(
            "text-xl font-bold",
            isEnterprise ? "text-gray-900" : "text-gray-900"
          )}
        >
          {plan.name}
        </h3>
        <PriceDisplay planId={plan.id} isAnnual={isAnnual} />
        <p className="mt-3 text-sm text-gray-600">{plan.tagline}</p>

        <ul className="mt-8 flex-1 space-y-3">
          {plan.features.map((f) => (
            <li
              key={f.text}
              className={cn(
                "flex items-start gap-2.5 text-sm",
                f.included ? "text-gray-700" : "text-gray-400"
              )}
            >
              {f.included ? (
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-gray-300" />
              )}
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        {ctaEl}
        {plan.footnote && (
          <p className="mt-3 text-center text-xs text-gray-500">
            {isEnterprise ? (
              <>
                or{" "}
                <Link
                  to="/auth/signup?plan=enterprise"
                  onClick={() => saveSelectedPlan("enterprise")}
                  className="text-purple-600 hover:underline"
                >
                  start with a 14-day free trial
                </Link>
              </>
            ) : (
              plan.footnote
            )}
          </p>
        )}
      </div>
    </div>
  )
}
