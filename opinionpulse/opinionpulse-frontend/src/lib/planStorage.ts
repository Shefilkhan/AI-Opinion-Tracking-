import type { PlanId } from "@/data/pricingData"

const KEY = "opinionpulse_selected_plan"

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

export function clearSelectedPlan() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function planDisplayName(plan: PlanId): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}
