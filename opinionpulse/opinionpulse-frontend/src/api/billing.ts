import { apiRequest } from "@/api/client"
import type { PlanId } from "@/data/pricingData"

export type BillingInterval = "monthly" | "annual"

export type BillingConfig = {
  configured: boolean
  publishable_key: string | null
}

export type CheckoutUiMode = "hosted" | "embedded"

export type CheckoutSessionResponse = {
  checkout_url?: string | null
  client_secret?: string | null
  session_id: string
}

export type PortalSessionResponse = {
  portal_url: string
}

export type CheckoutSessionStatus = {
  status: string
  plan_id: string | null
  plan_name: string | null
  synced: boolean
}

export function getBillingConfig() {
  return apiRequest<BillingConfig>("/api/billing/config")
}

export function createCheckoutSession(
  planId: PlanId,
  interval: BillingInterval,
  uiMode: CheckoutUiMode = "hosted"
) {
  return apiRequest<CheckoutSessionResponse>("/api/billing/checkout-session", {
    method: "POST",
    auth: true,
    body: { plan_id: planId, interval, ui_mode: uiMode },
  })
}

export function createPortalSession() {
  return apiRequest<PortalSessionResponse>("/api/billing/portal-session", {
    method: "POST",
    auth: true,
  })
}

export function syncCheckoutSession(sessionId: string) {
  return apiRequest<CheckoutSessionStatus>(`/api/billing/session/${sessionId}`, {
    auth: true,
  })
}
