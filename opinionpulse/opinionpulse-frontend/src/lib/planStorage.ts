import type { PlanId } from "@/data/pricingData"

const KEY = "opinionpulse_selected_plan"
const INTERVAL_KEY = "opinionpulse_selected_billing"

export type BillingInterval = "monthly" | "annual"

export function saveSelectedPlan(plan: PlanId) {
  try {
    localStorage.setItem(KEY, plan)
  } catch {
    /* ignore */
  }
}

export function getSelectedPlan(): PlanId | null {
  try {
    const v = localStorage.getItem(KEY)
    if (v === "starter" || v === "pro" || v === "enterprise") return v
    return null
  } catch {
    return null
  }
}

export function saveSelectedBillingInterval(interval: BillingInterval) {
  try {
    localStorage.setItem(INTERVAL_KEY, interval)
  } catch {
    /* ignore */
  }
}

export function getSelectedBillingInterval(): BillingInterval {
  try {
    const value = localStorage.getItem(INTERVAL_KEY)
    return value === "annual" ? "annual" : "monthly"
  } catch {
    return "monthly"
  }
}

export function clearSelectedBillingInterval() {
  try {
    localStorage.removeItem(INTERVAL_KEY)
  } catch {
    /* ignore */
  }
}

export function clearSelectedPlan() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(INTERVAL_KEY)
  } catch {
    /* ignore */
  }
}

export function planDisplayName(plan: PlanId): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}
