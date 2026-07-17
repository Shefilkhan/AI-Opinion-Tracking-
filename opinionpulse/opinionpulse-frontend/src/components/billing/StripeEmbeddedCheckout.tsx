import { useEffect, useRef, useState } from "react"
import { loadStripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js"
import { Loader2 } from "lucide-react"
import {
  createCheckoutSession,
  getBillingConfig,
  type BillingInterval,
} from "@/api/billing"
import { ApiError } from "@/api/client"
import type { PlanId } from "@/data/pricingData"

type StripeEmbeddedCheckoutProps = {
  planId: PlanId
  interval: BillingInterval
}

export function StripeEmbeddedCheckout({ planId, interval }: StripeEmbeddedCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let checkout: StripeEmbeddedCheckout | null = null
    let cancelled = false

    async function init() {
      try {
        setLoading(true)
        setError(null)

        const config = await getBillingConfig()
        if (!config.configured || !config.publishable_key) {
          throw new Error(
            "Payments are not configured yet. Add your Stripe keys to the backend .env.local file."
          )
        }

        const stripe = await loadStripe(config.publishable_key)
        if (!stripe || cancelled) return

        const session = await createCheckoutSession(planId, interval, "embedded")
        if (!session.client_secret || cancelled) return

        const embeddedCheckout = await stripe.createEmbeddedCheckoutPage({
          clientSecret: session.client_secret,
        })

        if (cancelled || !containerRef.current) {
          embeddedCheckout.destroy()
          return
        }

        checkout = embeddedCheckout
        checkout.mount(containerRef.current)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 503) {
          setError(
            "Payments are not configured yet. Add your Stripe keys to the backend .env.local file."
          )
          return
        }
        setError(err instanceof Error ? err.message : "Could not load checkout.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()

    return () => {
      cancelled = true
      checkout?.destroy()
    }
  }, [planId, interval])

  return (
    <div className="le-checkout-stripe">
      {loading && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-[var(--le-muted)]">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Loading secure checkout…</p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div ref={containerRef} className={loading ? "hidden" : undefined} />
    </div>
  )
}
