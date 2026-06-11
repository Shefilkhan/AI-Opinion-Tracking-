import { useCallback, useState } from "react"
import { PageSection } from "@/components/layout/PageSection"
import { Button } from "@/components/ui/button"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { Toggle } from "@/components/ui/toggle"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import {
  loadUserSettings,
  saveSettingsSection,
  type PrivacySettings as PrivacySettingsData,
  type ProfileVisibility,
} from "@/lib/userSettingsStore"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const VISIBILITY: { id: ProfileVisibility; label: string; desc: string }[] = [
  { id: "public", label: "Public", desc: "Anyone can view your profile." },
  { id: "friends", label: "Friends only", desc: "Only people you connect with." },
  { id: "private", label: "Private", desc: "Only you can view your profile." },
]

export function PrivacySettings() {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const { draft, setDraft, dirty, commitSaved, discard } =
    useSectionDirty<PrivacySettingsData>(loadUserSettings().privacy)

  const handleSave = useCallback(async () => {
    setSaving(true)
    saveSettingsSection("privacy", draft)
    commitSaved(draft)
    setSaving(false)
    showToast("Privacy settings saved.")
  }, [draft, commitSaved, showToast])

  useRegisterSectionSave("privacy", dirty, handleSave, discard)

  return (
    <SettingsPanel
      title="Privacy"
      description="Control visibility and data usage."
      onSave={handleSave}
      saving={saving}
    >
      <PageSection title="Profile visibility" className="mb-0">
        <fieldset className="space-y-2">
          <legend className="sr-only">Profile visibility</legend>
          {VISIBILITY.map((opt) => (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors duration-150",
                draft.profileVisibility === opt.id
                  ? "border-primary bg-primary/5"
                  : cn(proCard, "bg-muted/20 hover:border-muted-foreground/30")
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.id}
                checked={draft.profileVisibility === opt.id}
                onChange={() => setDraft((p) => ({ ...p, profileVisibility: opt.id }))}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                <span className="block text-sm text-muted-foreground">{opt.desc}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </PageSection>

      <PageSection title="Data & sharing" className="mb-0">
        <div className={cn(proCard, "divide-y divide-border bg-muted/20")}>
          <div className="p-4 sm:p-5">
            <Toggle
              id="show-email"
              label="Show email on profile"
              checked={draft.showEmailOnProfile}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, showEmailOnProfile: v }))}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="search-index"
              label="Allow search engines to index profile"
              checked={draft.allowSearchIndexing}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, allowSearchIndexing: v }))}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Toggle
              id="usage-analytics"
              label="Allow usage data collection"
              description="Help us improve OpinionPulse with anonymous usage stats."
              checked={draft.allowUsageAnalytics}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, allowUsageAnalytics: v }))}
            />
          </div>
        </div>
      </PageSection>

      <PageSection title="Your data" className="mb-0">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 px-4"
          onClick={() => showToast("Your data export will be emailed (demo).")}
        >
          Download my data
        </Button>
      </PageSection>
    </SettingsPanel>
  )
}
