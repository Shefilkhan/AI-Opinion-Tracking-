import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { SettingsSidebar } from "@/components/settings/SettingsSidebar"
import { SETTINGS_SECTIONS } from "@/components/settings/settingsNav"
import { SettingsUnsavedProvider, useSettingsUnsaved } from "@/components/settings/SettingsUnsavedContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
    <div
      className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
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

function SettingsLayoutInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const current = SETTINGS_SECTIONS.find((s) => location.pathname === s.href)

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="lg:hidden">
        <label htmlFor="settings-section-mobile" className="sr-only">
          Settings section
        </label>
        <select
          id="settings-section-mobile"
          value={current?.href ?? "/settings/profile"}
          onChange={(e) => navigate(e.target.value)}
          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Choose settings section"
        >
          {SETTINGS_SECTIONS.map((s) => (
            <option key={s.id} value={s.href}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-3">
          <SettingsSidebar />
        </div>
      </aside>

      <div className="hidden md:block lg:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger className="mb-2 inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors duration-150 hover:bg-gray-100">
            Browse settings sections
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-gray-200 bg-card p-4">
            <SheetHeader className="sr-only">
              <SheetTitle>Settings navigation</SheetTitle>
            </SheetHeader>
            <SettingsSidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="min-w-0 flex-1">
        <UnsavedBanner />
        <Outlet />
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
