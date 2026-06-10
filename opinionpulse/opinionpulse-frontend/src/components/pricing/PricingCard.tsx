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
          className="text-5xl font-bold tracking-tight text-foreground transition-all duration-300"
        >
          ${amount}
        </span>
        <span className="mb-2 text-lg text-muted-foreground">/mo</span>
      </div>
      {isAnnual && (
        <p className="mt-1 text-sm text-muted-foreground">
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
        "mt-8 flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors duration-300",
        "bg-foreground text-background hover:bg-foreground/90"
      )}
    >
      {plan.cta}
    </a>
  ) : (
    <Link
      to={`/auth/signup?plan=${plan.id}`}
      onClick={handleCta}
      className={cn(
        "mt-8 flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors duration-300",
        plan.ctaVariant === "gradient" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        plan.ctaVariant === "outline" &&
          "border-2 border-border bg-card text-foreground hover:border-primary hover:text-primary",
        plan.ctaVariant === "dark" &&
          "bg-foreground text-background hover:bg-foreground/90"
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
          <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
            {plan.badge}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex h-full flex-col rounded-2xl border bg-card p-8 transition-colors duration-300",
          isPro
            ? "border-2 border-primary md:scale-105"
            : "border-border hover:border-muted-foreground/30",
          isEnterprise && "hover:border-muted-foreground/40"
        )}
      >
        {plan.badge && plan.badgePosition === "corner" && (
          <span className="absolute right-6 top-6 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {plan.badge}
          </span>
        )}

        <h3 className="text-xl font-bold text-foreground">
          {plan.name}
        </h3>
        <PriceDisplay planId={plan.id} isAnnual={isAnnual} />
        <p className="mt-3 text-sm text-muted-foreground">{plan.tagline}</p>

        <ul className="mt-8 flex-1 space-y-3">
          {plan.features.map((f) => (
            <li
              key={f.text}
              className={cn(
                "flex items-start gap-2.5 text-sm",
                f.included ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {f.included ? (
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
              )}
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        {ctaEl}
        {plan.footnote && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {isEnterprise ? (
              <>
                or{" "}
                <Link
                  to="/auth/signup?plan=enterprise"
                  onClick={() => saveSelectedPlan("enterprise")}
                  className="text-primary hover:underline"
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
