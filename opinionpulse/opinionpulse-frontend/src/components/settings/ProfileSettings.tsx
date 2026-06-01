import { useCallback, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Upload } from "lucide-react"
import { getCurrentUser } from "@/api/auth"
import { updateAccountProfile } from "@/api/account"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FieldError, FormField, SettingsPanel } from "@/components/settings/SettingsPanel"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import {
  loadUserSettings,
  saveSettingsSection,
  type ProfileSettings as ProfileSettingsData,
} from "@/lib/userSettingsStore"
import {
  checkUsernameAvailable,
  validateBio,
  validateUsername,
} from "@/lib/settingsValidation"
import { cn } from "@/lib/utils"

const inputClass =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

export function ProfileSettings() {
  const { showToast } = useToast()
  const userQuery = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")

  const buildInitial = useCallback((): ProfileSettingsData => {
    const stored = loadUserSettings().profile
    const user = userQuery.data
    return {
      ...stored,
      fullName: user?.name ?? stored.fullName,
      email: user?.email ?? stored.email,
    }
  }, [userQuery.data])

  const { draft, setDraft, dirty, commitSaved, discard } = useSectionDirty(
    buildInitial()
  )

  useEffect(() => {
    if (!userQuery.data) return
    const next = buildInitial()
    commitSaved(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once when user loads
  }, [userQuery.data?.id])

  useEffect(() => {
    const u = draft.username.trim()
    if (!u || validateUsername(u)) {
      setUsernameStatus("idle")
      return
    }
    setUsernameStatus("checking")
    const t = setTimeout(async () => {
      const ok = await checkUsernameAvailable(u)
      setUsernameStatus(ok ? "available" : "taken")
    }, 450)
    return () => clearTimeout(t)
  }, [draft.username])

  const handleSave = useCallback(async () => {
    const nextErrors: Record<string, string> = {}
    if (!draft.fullName.trim()) nextErrors.fullName = "Full name is required."
    const userErr = validateUsername(draft.username)
    if (userErr) nextErrors.username = userErr
    if (usernameStatus === "taken") nextErrors.username = "This username is taken."
    const bioErr = validateBio(draft.bio)
    if (bioErr) nextErrors.bio = bioErr
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await updateAccountProfile({ name: draft.fullName.trim() })
      saveSettingsSection("profile", draft)
      commitSaved(draft)
      showToast("Profile saved successfully.")
    } catch {
      showToast("Could not save profile.", "error")
    } finally {
      setSaving(false)
    }
  }, [draft, usernameStatus, commitSaved, showToast])

  useRegisterSectionSave("profile", dirty, handleSave, discard)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((p) => ({ ...p, avatar: "Use JPG, PNG, or WebP." }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setDraft((p) => ({ ...p, avatarDataUrl: reader.result as string }))
      setErrors((p) => ({ ...p, avatar: "" }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <SettingsPanel
      title="Profile"
      description="Update how others see you on OpinionPulse."
      onSave={handleSave}
      saving={saving}
    >
      <FormField label="Profile photo" htmlFor="avatar-upload">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-muted">
            {draft.avatarDataUrl ? (
              <img
                src={draft.avatarDataUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-muted-foreground">
                {draft.fullName.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium transition-colors duration-150",
              "hover:bg-gray-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
          >
            <Upload className="size-4" aria-hidden />
            Upload photo
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>
        <FieldError message={errors.avatar} />
      </FormField>

      <FormField label="Full name" htmlFor="full-name" error={errors.fullName}>
        <Input
          id="full-name"
          value={draft.fullName}
          onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
          placeholder="Your name"
          className={inputClass}
          aria-invalid={!!errors.fullName}
        />
      </FormField>

      <FormField
        label="Username"
        htmlFor="username"
        error={errors.username}
        hint={
          usernameStatus === "available"
            ? "Username is available."
            : usernameStatus === "taken"
              ? undefined
              : "Letters, numbers, and underscores only."
        }
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            value={draft.username}
            onChange={(e) =>
              setDraft((p) => ({ ...p, username: e.target.value.replace(/\s/g, "") }))
            }
            placeholder="handle"
            className={cn(inputClass, "pl-8")}
            aria-invalid={!!errors.username || usernameStatus === "taken"}
          />
        </div>
        {usernameStatus === "checking" && (
          <p className="mt-1 text-xs text-muted-foreground">Checking availability…</p>
        )}
      </FormField>

      <FormField label="Email" htmlFor="email">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="email"
            type="email"
            value={draft.email}
            readOnly
            className={cn(inputClass, "flex-1 bg-muted")}
            aria-describedby="email-status"
          />
          <Badge
            variant={userQuery.data?.is_email_verified ? "secondary" : "outline"}
            id="email-status"
          >
            {userQuery.data?.is_email_verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
      </FormField>

      <FormField label="Bio" htmlFor="bio" error={errors.bio}>
        <textarea
          id="bio"
          value={draft.bio}
          onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Tell us about yourself"
          rows={3}
          maxLength={160}
          className={inputClass}
          aria-invalid={!!errors.bio}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {draft.bio.length}/160
        </p>
      </FormField>
    </SettingsPanel>
  )
}
