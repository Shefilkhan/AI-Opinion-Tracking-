import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import type { PlanId, PricingPlan } from "@/data/pricingData"
import { ENTERPRISE_EMAIL, planPrices } from "@/data/pricingData"
import { saveSelectedPlan } from "@/lib/planStorage"
import { cn } from "@/lib/utils"

type EditorialPricingCardProps = {
  plan: PricingPlan
  isAnnual: boolean
  compact?: boolean
}

const PREVIEW_FEATURE_COUNT = 6

export function EditorialPricingCard({ plan, isAnnual, compact = true }: EditorialPricingCardProps) {
  const prices = planPrices[plan.id]
  const amount = isAnnual ? prices.annual : prices.monthly
  const featured = plan.highlighted
  const includedFeatures = plan.features.filter((f) => f.included)
  const visibleFeatures = compact
    ? includedFeatures.slice(0, PREVIEW_FEATURE_COUNT)
    : includedFeatures

  const ctaClass = featured
    ? "bg-white/95 text-[var(--le-forest)] hover:bg-white"
    : "bg-[var(--le-sage-soft)] text-[var(--le-forest)] hover:bg-[var(--le-sage-muted)]"

  const ctaContent = plan.ctaMailto ? (
    <a href={ENTERPRISE_EMAIL} className={cn("le-pricing-cta", ctaClass)}>
      {plan.cta}
    </a>
  ) : (
    <Link
      to={`/auth/signup?plan=${plan.id}`}
      onClick={() => saveSelectedPlan(plan.id)}
      className={cn("le-pricing-cta", ctaClass)}
    >
      {plan.cta}
    </Link>
  )

  return (
    <div
      className={cn(
        "le-pricing-card flex h-full flex-col",
        featured && "le-pricing-card-featured"
      )}
    >
      {plan.badge && plan.badgePosition === "top" && (
        <span className="le-pricing-popular">{plan.badge.replace("✨ ", "")}</span>
      )}

      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="font-serif-display text-lg font-semibold">{plan.name}</h3>
        {plan.badge && plan.badgePosition === "corner" && (
          <span className="le-pricing-corner-badge">{plan.badge}</span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-end gap-1">
          <span className="font-serif-display text-4xl font-semibold tracking-tight">${amount}</span>
          <span className="mb-1 text-sm opacity-80">/mo</span>
        </div>
        {isAnnual && (
          <p className="mt-1 text-xs opacity-75">billed ${prices.annualTotal}/year</p>
        )}
        {!isAnnual && plan.id !== "enterprise" && (
          <p className="mt-1 text-xs opacity-75">per user · billed monthly</p>
        )}
      </div>

      <p className={cn("mb-4 text-sm", featured ? "text-white/85" : "text-[var(--le-muted)]")}>
        {plan.tagline}
      </p>

      <ul className="mb-6 flex-1 space-y-2.5">
        {visibleFeatures.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                featured ? "bg-white/20 text-white" : "bg-[var(--le-sage-soft)] text-[var(--le-forest)]"
              )}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            <span className={featured ? "text-white/90" : "text-[var(--le-text)]"}>{f.text}</span>
          </li>
        ))}
      </ul>

      {ctaContent}

      {plan.footnote && (
        <p className={cn("mt-3 text-center text-[11px]", featured ? "text-white/70" : "text-[var(--le-muted)]")}>
          {plan.footnote}
        </p>
      )}
    </div>
  )
}

export function editorialPlanOrder(id: PlanId): string {
  if (id === "pro") return "order-1 md:order-2"
  if (id === "starter") return "order-2 md:order-1"
  return "order-3"
}
