import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle, Loader2 } from "lucide-react"
import { syncCheckoutSession } from "@/api/billing"
import { ApiError } from "@/api/client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useAuth } from "@/contexts/AuthContext"
import { clearSelectedPlan } from "@/lib/planStorage"
import { useUsage } from "@/hooks/useUsage"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function BillingSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { refreshUser } = useAuth()
  const { refresh: refreshUsage } = useUsage()
  const [planName, setPlanName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function confirmPayment() {
      if (!sessionId) {
        setError("Missing checkout session. If you completed payment, check Settings → Billing.")
        setLoading(false)
        return
      }

      try {
        const result = await syncCheckoutSession(sessionId)
        if (cancelled) return
        setPlanName(result.plan_name)
        clearSelectedPlan()
        await refreshUser()
        await refreshUsage()
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.detail
              : "We could not confirm your payment yet. It may still be processing."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void confirmPayment()
    return () => {
      cancelled = true
    }
  }, [sessionId, refreshUser, refreshUsage])

  return (
    <DashboardLayout title="Payment successful" hidePageHeader>
      <div className={cn(proCard, "mx-auto max-w-lg p-8 text-center")}>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirming your subscription…</p>
          </div>
        ) : error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <Link
              to="/settings#billing"
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
            >
              Open billing settings
            </Link>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto mb-4 size-12 text-success" />
            <h2 className="text-xl font-semibold text-foreground">You&apos;re all set!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {planName
                ? `Your ${planName} subscription is now active.`
                : "Your subscription is now active."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
              >
                Go to dashboard
              </Link>
              <Link
                to="/settings#billing"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground no-underline"
              >
                View billing
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
