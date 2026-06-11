import { useCallback, useState } from "react"
import { Download } from "lucide-react"
import { PageSection } from "@/components/layout/PageSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import {
  loadUserSettings,
  saveSettingsSection,
  type BillingSettings as BillingSettingsData,
  type BillingPlan,
} from "@/lib/userSettingsStore"
import { proCard, tableHeader, tableRow } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const PLAN_LABELS: Record<BillingPlan, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
}

const INVOICES = [
  { id: "1", date: "2026-04-01", amount: "$0.00", status: "Paid" },
  { id: "2", date: "2026-03-01", amount: "$0.00", status: "Paid" },
  { id: "3", date: "2026-02-01", amount: "$29.00", status: "Paid" },
]

export function BillingSettings() {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const { draft, setDraft, dirty, commitSaved, discard } =
    useSectionDirty<BillingSettingsData>(loadUserSettings().billing)

  const handleSave = useCallback(async () => {
    setSaving(true)
    saveSettingsSection("billing", draft)
    commitSaved(draft)
    setSaving(false)
    showToast("Billing preferences saved.")
  }, [draft, commitSaved, showToast])

  useRegisterSectionSave("billing", dirty, handleSave, discard)

  return (
    <>
      <SettingsPanel
        title="Billing"
        description="Manage your plan and payment details."
        onSave={handleSave}
        saving={saving}
        saveLabel="Save billing info"
      >
        <PageSection title="Current plan" className="mb-0">
          <div className={cn(proCard, "flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 sm:p-5")}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-medium text-foreground">
                  {PLAN_LABELS[draft.plan]}
                </span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
            <Button
              type="button"
              className="min-h-10 px-4"
              onClick={() => {
                setDraft((p) => ({
                  ...p,
                  plan: p.plan === "free" ? "pro" : p.plan === "pro" ? "enterprise" : "free",
                }))
              }}
            >
              {draft.plan === "enterprise" ? "Downgrade" : "Upgrade plan"}
            </Button>
          </div>
        </PageSection>

        <PageSection title="Payment method" className="mb-0">
          <div className={cn(proCard, "bg-muted/20 p-4 sm:p-5")}>
            <p className="text-sm text-muted-foreground">
              {draft.cardBrand} ending in {draft.cardLast4}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 min-h-10 px-4"
              onClick={() => showToast("Payment method update (demo).")}
            >
              Update payment method
            </Button>
          </div>
        </PageSection>

        <PageSection title="Billing history" className="mb-0">
          <div className={cn(proCard, "overflow-x-auto bg-muted/20")}>
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className={tableHeader}>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((row) => (
                  <tr key={row.id} className={tableRow}>
                    <td className="px-4 py-3 text-foreground">{row.date}</td>
                    <td className="px-4 py-3 text-foreground">{row.amount}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-success/5 text-success">{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary"
                        onClick={() => showToast(`Downloading invoice ${row.id} (demo).`)}
                      >
                        <Download className="size-3.5" aria-hidden />
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageSection>
      </SettingsPanel>

      <SettingsPanel
        title="Danger zone"
        description="Cancel your subscription. You will retain access until the end of the billing period."
        showSave={false}
        danger
      >
        <Button
          type="button"
          variant="destructive"
          className="min-h-10 px-4"
          onClick={() => showToast("Subscription cancellation (demo).", "error")}
        >
          Cancel subscription
        </Button>
      </SettingsPanel>
    </>
  )
}
