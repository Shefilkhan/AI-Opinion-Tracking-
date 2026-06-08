import { Link } from "react-router-dom"
import { Check, X } from "lucide-react"
import type { PlanId, PricingPlan } from "@/data/pricingData"
import { planPrices, ENTERPRISE_EMAIL } from "@/data/pricingData"
import GlowCard from "@/components/ui/GlowCard"
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

      <GlowCard
        glowColor={isPro ? "168, 85, 247" : "139, 92, 246"}
        className={cn(
          "glow-card-pricing flex h-full flex-col rounded-[20px] p-8 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isPro &&
            "glow-card-pro shadow-xl shadow-purple-200/60 md:scale-105 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-200",
          !isPro && "hover:-translate-y-1 hover:shadow-xl"
        )}
      >
        {plan.badge && plan.badgePosition === "corner" ? (
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {plan.badge}
            </span>
          </div>
        ) : (
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        )}
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
      </GlowCard>
    </div>
  )
}
