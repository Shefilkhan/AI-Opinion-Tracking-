import { useState } from "react"
import { Loader2 } from "lucide-react"
import { SettingsSidebar } from "@/components/settings/SettingsSidebar"
import { SettingsMobileTabs } from "@/components/settings/SettingsMobileTabs"
import { useSettingsSection } from "@/components/settings/useSettingsSection"
import { SettingsUnsavedProvider, useSettingsUnsaved } from "@/components/settings/SettingsUnsavedContext"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { AccountSettings } from "@/components/settings/AccountSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { AppearanceSettings } from "@/components/settings/AppearanceSettings"
import { PrivacySettings } from "@/components/settings/PrivacySettings"
import { BillingSettings } from "@/components/settings/BillingSettings"
import type { SettingsSectionId } from "@/components/settings/settingsNav"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { Button } from "@/components/ui/button"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

function UnsavedBanner() {
  const { activeUnsaved } = useSettingsUnsaved()
  const [saving, setSaving] = useState(false)

  if (!activeUnsaved) return null

  async function handleSave() {
    setSaving(true)
    try {
      await activeUnsaved!.onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <InlineNotice variant="warning" title="You have unsaved changes" className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 px-3"
          onClick={() => activeUnsaved.onDiscard()}
          disabled={saving}
        >
          Discard
        </Button>
        <Button
          type="button"
          className={cn("h-9 gap-2 px-3", btnPrimary)}
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save
        </Button>
      </div>
    </InlineNotice>
  )
}

function SettingsSectionContent({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case "profile":
      return <ProfileSettings />
    case "account":
      return <AccountSettings />
    case "notifications":
      return <NotificationSettings />
    case "appearance":
      return <AppearanceSettings />
    case "privacy":
      return <PrivacySettings />
    case "billing":
      return <BillingSettings />
    default:
      return <ProfileSettings />
  }
}

function SettingsLayoutInner() {
  const { activeSection, setSection } = useSettingsSection()

  return (
    <div className="w-full">
      <SettingsMobileTabs activeSection={activeSection} onSelect={setSection} />

      <div className="mt-6 flex flex-col gap-8 md:flex-row md:gap-10 lg:gap-12">
        <aside className="hidden shrink-0 md:block md:w-56 lg:w-60">
          <div className="sticky top-24">
            <SettingsSidebar activeSection={activeSection} onSelect={setSection} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 md:border-l md:border-border md:pl-8 lg:pl-10">
          <UnsavedBanner />
          <div
            key={activeSection}
            className="settings-section-animate w-full max-w-2xl space-y-6"
          >
            <SettingsSectionContent section={activeSection} />
          </div>
        </main>
      </div>
    </div>
  )
}

export function SettingsLayout() {
  return (
    <SettingsUnsavedProvider>
      <SettingsLayoutInner />
    </SettingsUnsavedProvider>
  )
}
