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

function planStatusLabel(status: string): string {
  if (status === "past_due") return "Past due"
  if (status === "canceled") return "Canceled"
  return "Active"
}

function planStatusClass(status: string): string {
  if (status === "past_due") return "bg-destructive/10 text-destructive"
  if (status === "canceled") return "bg-muted text-muted-foreground"
  return "bg-success/5 text-success"
}

function planDescription(planId: string, hasStripeBilling: boolean): string {
  if (planId === "starter") {
    return "Free plan with core search and dashboard features. Upgrade anytime for unlimited searches and AI tools."
  }
  if (planId === "enterprise") {
    return hasStripeBilling
      ? "Enterprise plan with full platform access, API access, and priority support."
      : "Your Enterprise plan is active on this account."
  }
  return hasStripeBilling
    ? "Pro plan with unlimited searches, all data sources, and AI-powered insights."
    : "Your Pro plan is active on this account."
}

export function BillingSettings() {
  const navigate = useNavigate()
  const { usage, loading } = useUsage()
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading || !usage) {
    return <LoadingState label="Loading billing…" />
  }

  const isStarter = usage.plan.id === "starter"
  const hasStripeBilling = usage.billing.available
  const statusLabel = planStatusLabel(usage.plan.status)

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

  async function handleUpgrade() {
    setCheckoutLoading(true)
    setError(null)
    try {
      if (usage?.plan.id === "enterprise") {
        navigate("/pricing")
        return
      }
      await redirectToCheckout("pro", "monthly")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.")
      setCheckoutLoading(false)
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
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-medium text-foreground">{usage.plan.name}</span>
                <Badge className={planStatusClass(usage.plan.status)}>{statusLabel}</Badge>
                {isStarter && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Free
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {planDescription(usage.plan.id, hasStripeBilling)}
              </p>
              {hasStripeBilling && usage.billing.renews_at && (
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
            <div className="flex flex-col gap-2 sm:flex-row">
              {isStarter ? (
                <>
                  <Button
                    type="button"
                    className="min-h-10 gap-2 px-5"
                    onClick={() => void handleUpgrade()}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
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
                    onClick={() => navigate("/pricing")}
                  >
                    Compare plans
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 px-4"
                  onClick={() => navigate("/pricing")}
                >
                  Change plan
                </Button>
              )}
            </div>
          </div>
        </PageSection>

        {hasStripeBilling ? (
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
        ) : !isStarter ? (
          <PageSection title="Payment & invoices" className="mb-0">
            <div className={cn(proCard, "bg-muted/20 p-4 sm:p-5")}>
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CreditCard className="size-4" strokeWidth={2} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                This account has an active {usage.plan.name} plan but no Stripe subscription
                is linked. Subscribe to manage payment details and invoices here.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 min-h-10 gap-2 px-4"
                onClick={() => void handleUpgrade()}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Set up billing
              </Button>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
          </PageSection>
        ) : null}
      </SettingsPanel>

      {hasStripeBilling && (
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
      )}
    </>
  )
}
