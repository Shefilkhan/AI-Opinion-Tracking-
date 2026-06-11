import { useCallback, useState } from "react"
import { PageSection } from "@/components/layout/PageSection"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { Toggle } from "@/components/ui/toggle"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import {
  loadUserSettings,
  saveSettingsSection,
  type NotificationSettings as NotificationSettingsData,
} from "@/lib/userSettingsStore"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function NotificationSettings() {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const { draft, setDraft, dirty, commitSaved, discard } =
    useSectionDirty<NotificationSettingsData>(loadUserSettings().notifications)

  const handleSave = useCallback(async () => {
    setSaving(true)
    saveSettingsSection("notifications", draft)
    commitSaved(draft)
    setSaving(false)
    showToast("Notification preferences saved.")
  }, [draft, commitSaved, showToast])

  useRegisterSectionSave("notifications", dirty, handleSave, discard)

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose how we contact you."
      onSave={handleSave}
      saving={saving}
      saveLabel="Save preferences"
    >
      <PageSection title="Email notifications" className="mb-0">
        <div className={cn(proCard, "divide-y divide-border bg-muted/20")}>
          <div className="p-4 sm:p-5">
            <Toggle
              id="email-product"
              label="Product updates"
              description="New features and improvements."
              checked={draft.emailProductUpdates}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, emailProductUpdates: v }))}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="email-security"
              label="Security alerts"
              description="Login attempts and password changes."
              checked={draft.emailSecurityAlerts}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, emailSecurityAlerts: v }))}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="email-digest"
              label="Weekly digest"
              description="Summary of your projects and sentiment."
              checked={draft.emailWeeklyDigest}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, emailWeeklyDigest: v }))}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="email-marketing"
              label="Marketing emails"
              description="Tips, offers, and partner news."
              checked={draft.emailMarketing}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, emailMarketing: v }))}
            />
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Push notifications"
        description="Browser push is available when you enable notifications for this site."
        className="mb-0"
      >
        <div className={cn(proCard, "divide-y divide-border bg-muted/20")}>
          <div className="p-4 sm:p-5">
            <Toggle
              id="push-enabled"
              label="Enable push notifications"
              checked={draft.pushEnabled}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, pushEnabled: v }))}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="push-mentions"
              label="New mentions"
              checked={draft.pushMentions}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, pushMentions: v }))}
              disabled={!draft.pushEnabled}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="push-alerts"
              label="Alert triggers"
              checked={draft.pushAlerts}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, pushAlerts: v }))}
              disabled={!draft.pushEnabled}
            />
          </div>
        </div>
      </PageSection>
    </SettingsPanel>
  )
}
