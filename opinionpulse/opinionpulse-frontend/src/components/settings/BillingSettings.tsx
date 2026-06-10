import { useCallback, useState } from "react"
import { Download } from "lucide-react"
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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-semibold text-foreground">
                {PLAN_LABELS[draft.plan]}
              </span>
              <Badge variant="secondary">{draft.plan === "free" ? "Active" : "Active"}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="min-h-11 px-4 py-2"
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
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Payment method</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {draft.cardBrand} ending in {draft.cardLast4}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11 px-4 py-2"
            onClick={() => showToast("Payment method update (demo).")}
          >
            Update payment method
          </Button>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Billing history</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
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
        </div>
      </SettingsPanel>

      <SettingsPanel title="Danger zone" showSave={false}>
        <p className="text-sm text-muted-foreground">
          Cancel your subscription. You will retain access until the end of the billing period.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="mt-4 min-h-11 px-4 py-2"
          onClick={() => showToast("Subscription cancellation (demo).", "error")}
        >
          Cancel subscription
        </Button>
      </SettingsPanel>
    </>
  )
}
