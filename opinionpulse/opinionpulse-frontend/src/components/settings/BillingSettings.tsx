import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react"
import { createPortalSession } from "@/api/billing"
import { ApiError } from "@/api/client"
import { PageSection } from "@/components/layout/PageSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/LoadingState"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { useUsage } from "@/hooks/useUsage"
import { redirectToCheckout } from "@/lib/startCheckout"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

function BillingEmptyState({ planName }: { planName: string }) {
  const [loadingPlan, setLoadingPlan] = useState<"pro" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoadingPlan("pro")
    setError(null)
    try {
      await redirectToCheckout("pro", "monthly")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.")
      setLoadingPlan(null)
    }
  }

  return (
    <SettingsPanel
      title="Billing"
      description="Manage your plan and payment details."
      showSave={false}
    >
      <div className={cn(proCard, "bg-muted/20 p-6 sm:p-8")}>
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <h3 className="text-lg font-semibold text-foreground">No active subscription</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You&apos;re on the <strong>{planName}</strong> plan. Subscribe to unlock paid
            features and manage billing here.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="min-h-10 gap-2 px-5"
              onClick={() => void handleUpgrade()}
              disabled={loadingPlan !== null}
            >
              {loadingPlan ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Upgrade to Pro
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-10 px-5"
              onClick={() => window.location.assign("/pricing")}
            >
              Compare plans
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </SettingsPanel>
  )
}

export function BillingSettings() {
  const navigate = useNavigate()
  const { usage, loading } = useUsage()
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <LoadingState label="Loading billing…" />
  }

  if (!usage?.billing.available) {
    return <BillingEmptyState planName={usage?.plan.name ?? "Starter"} />
  }

  const statusLabel =
    usage.plan.status === "past_due"
      ? "Past due"
      : usage.plan.status === "canceled"
        ? "Canceled"
        : "Active"

  const statusClass =
    usage.plan.status === "past_due"
      ? "bg-destructive/10 text-destructive"
      : usage.plan.status === "canceled"
        ? "bg-muted text-muted-foreground"
        : "bg-success/5 text-success"

  async function openPortal() {
    setPortalLoading(true)
    setError(null)
    try {
      const { portal_url } = await createPortalSession()
      window.location.assign(portal_url)
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Could not open billing portal.")
      setPortalLoading(false)
    }
  }

  return (
    <>
      <SettingsPanel
        title="Billing"
        description="Manage your plan and payment details."
        showSave={false}
      >
        <PageSection title="Current plan" className="mb-0">
          <div
            className={cn(
              proCard,
              "flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 sm:p-5"
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-medium text-foreground">{usage.plan.name}</span>
                <Badge className={statusClass}>{statusLabel}</Badge>
              </div>
              {usage.billing.renews_at && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Renews on{" "}
                  {new Date(usage.billing.renews_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-10 px-4"
              onClick={() => navigate("/pricing")}
            >
              Change plan
            </Button>
          </div>
        </PageSection>

        <PageSection title="Payment & invoices" className="mb-0">
          <div className={cn(proCard, "bg-muted/20 p-4 sm:p-5")}>
            <p className="text-sm text-muted-foreground">
              Update your card, download invoices, or cancel your subscription in the
              secure Stripe customer portal.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 min-h-10 gap-2 px-4"
              onClick={() => void openPortal()}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Manage billing
            </Button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
        </PageSection>
      </SettingsPanel>

      <SettingsPanel
        title="Danger zone"
        description="Cancel or change your subscription through the billing portal."
        showSave={false}
        danger
      >
        <Button
          type="button"
          variant="destructive"
          className="min-h-10 gap-2 px-4"
          onClick={() => void openPortal()}
          disabled={portalLoading}
        >
          Cancel or change subscription
        </Button>
      </SettingsPanel>
    </>
  )
}
