import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, LogOut } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

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
    <div
      className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm font-medium text-foreground">You have unsaved changes</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 py-2"
          onClick={() => activeUnsaved.onDiscard()}
          disabled={saving}
        >
          Discard
        </Button>
        <Button
          type="button"
          className={cn("h-10 gap-2 px-4 py-2", btnPrimary)}
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save
        </Button>
      </div>
    </div>
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
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate("/")
  }

  return (
    <div className="settings-page mx-auto max-w-5xl px-6 py-8">
      <div className="settings-header mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          className="h-10 shrink-0 gap-2 px-4"
        >
          <LogOut className="size-4" aria-hidden />
          Logout
        </Button>
      </div>

      <hr className="settings-divider border-border" />

      <SettingsMobileTabs
        activeSection={activeSection}
        onSelect={setSection}
      />

      <div className="settings-body mt-6 flex gap-0">
        <aside className="settings-sidebar sticky top-6 hidden self-start md:block">
          <SettingsSidebar activeSection={activeSection} onSelect={setSection} />
        </aside>

        <main className="settings-content min-w-0 flex-1 md:border-l md:border-border md:pl-10">
          <UnsavedBanner />
          <div
            key={activeSection}
            className="settings-section-animate mx-auto max-w-[640px] space-y-6"
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
