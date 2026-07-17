import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import "@/styles/landing-editorial.css"
import { CheckoutOrderSummary } from "@/components/billing/CheckoutOrderSummary"
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout"
import { useAuth } from "@/contexts/AuthContext"
import { pricingPlans, ENTERPRISE_EMAIL, type PlanId } from "@/data/pricingData"
import { signupUrlForPlan } from "@/lib/startCheckout"

const VALID_PLANS: PlanId[] = ["starter", "pro", "enterprise"]

function isPlanId(value: string | undefined): value is PlanId {
  return VALID_PLANS.includes(value as PlanId)
}

export function PlanCheckoutPage() {
  const { planId } = useParams<{ planId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
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

  const interval = isAnnual ? "annual" : "monthly"

  return (
    <div className="landing-editorial le-checkout-page">
      <CheckoutOrderSummary
        plan={plan}
        planId={planId}
        isAnnual={isAnnual}
        onBillingChange={setIsAnnual}
      />

      <section className="le-checkout-payment">
        <div className="le-checkout-payment-inner">
          {planId === "enterprise" ? (
            <EnterpriseCheckoutPanel />
          ) : authLoading ? (
            <div className="flex min-h-[320px] items-center justify-center text-[var(--le-muted)]">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : isAuthenticated ? (
            <>
              {user?.email && (
                <p className="mb-6 text-sm text-[var(--le-muted)]">
                  Subscribing as <span className="font-medium text-[var(--le-text)]">{user.email}</span>
                </p>
              )}
              <StripeEmbeddedCheckout planId={planId} interval={interval} />
            </>
          ) : (
            <AuthCheckoutPanel planId={planId} interval={interval} />
          )}

          <p className="le-checkout-powered mt-8 text-center text-xs text-[var(--le-muted)]">
            Secure payments powered by{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-2 hover:underline"
            >
              Stripe
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}

function AuthCheckoutPanel({
  planId,
  interval,
}: {
  planId: PlanId
  interval: "monthly" | "annual"
}) {
  const signInUrl = `/auth/signin?redirect=${encodeURIComponent(`/pricing/${planId}?billing=${interval}`)}`
  const signUpUrl = signupUrlForPlan(planId, interval)

  return (
    <div className="le-checkout-auth-card">
      <h2 className="font-serif-display text-2xl font-semibold text-[var(--le-text)]">
        Sign in to subscribe
      </h2>
      <p className="mt-2 text-sm text-[var(--le-muted)]">
        Create an account or sign in to complete your subscription with secure checkout.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link to={signUpUrl} className="le-pricing-cta bg-[var(--le-forest)] text-white hover:opacity-90">
          Create account
        </Link>
        <Link
          to={signInUrl}
          className="le-pricing-cta border border-[var(--le-border)] bg-transparent text-[var(--le-text)] hover:bg-[var(--le-sage-soft)]"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

function EnterpriseCheckoutPanel() {
  return (
    <div className="le-checkout-auth-card">
      <h2 className="font-serif-display text-2xl font-semibold text-[var(--le-text)]">
        Talk to sales
      </h2>
      <p className="mt-2 text-sm text-[var(--le-muted)]">
        Enterprise includes team workspaces, advanced security, custom integrations, and dedicated
        support. We&apos;ll tailor a plan for your organization.
      </p>
      <a
        href={ENTERPRISE_EMAIL}
        className="le-pricing-cta mt-8 inline-flex bg-[var(--le-forest)] text-white hover:opacity-90"
      >
        Contact sales
      </a>
    </div>
  )
}
