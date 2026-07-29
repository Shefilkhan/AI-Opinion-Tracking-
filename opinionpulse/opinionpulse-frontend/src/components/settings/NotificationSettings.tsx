import { useCallback, useEffect, useState } from "react"
import { PageSection } from "@/components/layout/PageSection"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { Toggle } from "@/components/ui/toggle"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import {
  getAlertPreferences,
  updateAlertPreferences,
  type AlertPreferences,
} from "@/api/brandWatches"
import {
  loadUserSettings,
  saveSettingsSection,
  type NotificationSettings as NotificationSettingsData,
} from "@/lib/userSettingsStore"
import { inputSurface, proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function NotificationSettings() {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const { draft, setDraft, dirty, commitSaved, discard } =
    useSectionDirty<NotificationSettingsData>(loadUserSettings().notifications)

  const [brandPrefs, setBrandPrefs] = useState<AlertPreferences | null>(null)
  const [brandDraft, setBrandDraft] = useState<AlertPreferences | null>(null)
  const [brandDirty, setBrandDirty] = useState(false)
  const [slackUrl, setSlackUrl] = useState("")

  useEffect(() => {
    void getAlertPreferences()
      .then((prefs) => {
        setBrandPrefs(prefs)
        setBrandDraft(prefs)
        setSlackUrl(prefs.slack_webhook_url ?? "")
      })
      .catch(() => {
        /* offline — local toggles only */
      })
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    saveSettingsSection("notifications", draft)
    commitSaved(draft)

    if (brandDraft) {
      try {
        const updated = await updateAlertPreferences({
          email_crisis: brandDraft.email_crisis,
          email_weekly_report: brandDraft.email_weekly_report,
          slack_crisis: brandDraft.slack_crisis,
          slack_webhook_url: slackUrl.trim() || null,
        })
        setBrandPrefs(updated)
        setBrandDraft(updated)
        setBrandDirty(false)
      } catch {
        showToast("Brand alert preferences saved locally only — backend unavailable.")
      }
    }

    setSaving(false)
    showToast("Notification preferences saved.")
  }, [draft, commitSaved, brandDraft, slackUrl, showToast])

  useRegisterSectionSave(
    "notifications",
    dirty || brandDirty,
    handleSave,
    () => {
      discard()
      if (brandPrefs) {
        setBrandDraft(brandPrefs)
        setSlackUrl(brandPrefs.slack_webhook_url ?? "")
        setBrandDirty(false)
      }
    }
  )

  function patchBrand(patch: Partial<AlertPreferences>) {
    setBrandDraft((prev) => {
      const next = { ...(prev ?? brandPrefs ?? {}), ...patch } as AlertPreferences
      return next
    })
    setBrandDirty(true)
  }

  const brand = brandDraft ?? brandPrefs

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose how we contact you."
      onSave={handleSave}
      saving={saving}
      saveLabel="Save preferences"
    >
      <PageSection
        title="Brand & reputation alerts"
        description="Email and Slack when a watch enters the crisis quadrant."
        className="mb-0"
      >
        <div className={cn(proCard, "divide-y divide-border bg-muted/20")}>
          <div className="p-4 sm:p-5">
            <Toggle
              id="email-crisis"
              label="Crisis email alerts"
              description="Sent when volume + negative acceleration hit crisis level."
              checked={brand?.email_crisis ?? true}
              onCheckedChange={(v) => patchBrand({ email_crisis: v })}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="email-weekly"
              label="Weekly reputation report"
              description="Email digest of mentions, sentiment shift, and alert events."
              checked={brand?.email_weekly_report ?? false}
              onCheckedChange={(v) => patchBrand({ email_weekly_report: v })}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="slack-crisis"
              label="Slack crisis alerts"
              description="Post to your Slack channel when crisis quadrant is hit."
              checked={brand?.slack_crisis ?? false}
              onCheckedChange={(v) => patchBrand({ slack_crisis: v })}
            />
            <label className="mt-3 block text-xs text-muted-foreground">
              Slack incoming webhook URL
              <input
                type="url"
                value={slackUrl}
                onChange={(e) => {
                  setSlackUrl(e.target.value)
                  setBrandDirty(true)
                }}
                placeholder="https://hooks.slack.com/services/..."
                className={cn(inputSurface, "mt-1 block h-10 w-full font-mono text-xs")}
              />
            </label>
          </div>
        </div>
      </PageSection>

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
