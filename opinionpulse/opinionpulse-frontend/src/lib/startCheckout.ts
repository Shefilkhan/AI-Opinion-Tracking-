import { createCheckoutSession, type BillingInterval } from "@/api/billing"
import { ApiError } from "@/api/client"
import type { PlanId } from "@/data/pricingData"
import { saveSelectedPlan, saveSelectedBillingInterval } from "@/lib/planStorage"

export function planCheckoutUrl(planId: PlanId, interval: BillingInterval) {
  return `/pricing/${planId}?billing=${interval}`
}

export async function redirectToCheckout(
  planId: PlanId,
  interval: BillingInterval
): Promise<void> {
  saveSelectedPlan(planId)
  saveSelectedBillingInterval(interval)

  try {
    const session = await createCheckoutSession(planId, interval, "hosted")
    if (!session.checkout_url) {
      throw new Error("Could not start checkout session.")
    }
    window.location.assign(session.checkout_url)
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) {
      throw new Error(
        "Payments are not configured yet. Add your Stripe keys to the backend .env.local file.",
        { cause: err }
      )
    }
    throw err
  }
}

export function signupUrlForPlan(planId: PlanId, interval: BillingInterval) {
  return `/auth/signup?plan=${planId}&billing=${interval}`
}
