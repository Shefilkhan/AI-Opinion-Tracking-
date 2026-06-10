import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { SignUpForm } from "@/components/auth/SignUpForm"
import type { PlanId } from "@/data/pricingData"
import { saveSelectedPlan, planDisplayName, getSelectedPlan } from "@/lib/planStorage"
import { cn } from "@/lib/utils"
import { proCard } from "@/lib/ui-classes"

export function SignUpPage() {
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get("plan") as PlanId | null

  useEffect(() => {
    if (planParam === "starter" || planParam === "pro" || planParam === "enterprise") {
      saveSelectedPlan(planParam)
    }
  }, [planParam])

  const selected =
    planParam === "starter" || planParam === "pro" || planParam === "enterprise"
      ? planParam
      : getSelectedPlan()

  return (
    <AuthSplitLayout
      variant="signup"
      topLink={{
        text: "Already have an account?",
        href: "/auth/signin",
        label: "Sign in",
      }}
    >
      {selected && (
        <p
          className={cn(
            proCard,
            "mb-4 px-3 py-2 text-center text-sm text-accent-foreground bg-accent"
          )}
        >
          Plan selected: <strong className="font-medium text-foreground">{planDisplayName(selected)}</strong>
        </p>
      )}
      <SignUpForm />
    </AuthSplitLayout>
  )
}
