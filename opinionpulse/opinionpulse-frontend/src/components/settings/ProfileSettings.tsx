import { useCallback, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { getCurrentUser } from "@/api/auth"
import { patchUserProfile, uploadUserAvatar } from "@/api/users"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FieldError, FormField, SettingsPanel } from "@/components/settings/SettingsPanel"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import { resolveMediaUrl } from "@/lib/formatUtils"
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
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 hover:bg-white focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-[#2d2d44] dark:bg-[#252538] dark:text-white dark:placeholder:text-gray-500 dark:hover:bg-[#2a2a40] dark:focus:bg-[#2a2a40]"

export function ProfileSettings() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const userQuery = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")

  const buildInitial = useCallback((): ProfileSettingsData => {
    const stored = loadUserSettings().profile
    const user = userQuery.data
    return {
      ...stored,
      fullName: user?.full_name ?? user?.name ?? stored.fullName,
      email: user?.email ?? stored.email,
      username: user?.username ?? stored.username ?? "",
      bio: user?.bio ?? stored.bio ?? "",
      avatarDataUrl: user?.avatar_url
        ? resolveMediaUrl(user.avatar_url) ?? stored.avatarDataUrl
        : stored.avatarDataUrl,
    }
  }, [userQuery.data])

  const { draft, setDraft, dirty, commitSaved, discard } = useSectionDirty(
    buildInitial()
  )

  useEffect(() => {
    if (!userQuery.data) return
    commitSaved(buildInitial())
  }, [userQuery.data, buildInitial, commitSaved])

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
    const trimmedUsername = draft.username.trim()
    if (trimmedUsername) {
      const userErr = validateUsername(trimmedUsername)
      if (userErr) nextErrors.username = userErr
      if (usernameStatus === "taken")
        nextErrors.username = "This username is taken."
    }
    const bioErr = validateBio(draft.bio)
    if (bioErr) nextErrors.bio = bioErr
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await patchUserProfile({
        full_name: draft.fullName.trim(),
        username: draft.username.trim() || null,
        bio: draft.bio.trim() || null,
      })
      saveSettingsSection("profile", draft)
      commitSaved(draft)
      await queryClient.invalidateQueries({ queryKey: ["current-user"] })
      await queryClient.invalidateQueries({ queryKey: ["account-profile"] })
      showToast("Profile updated ✓")
    } catch {
      showToast("Could not save profile.", "error")
    } finally {
      setSaving(false)
    }
  }, [draft, usernameStatus, commitSaved, showToast, queryClient])

  useRegisterSectionSave("profile", dirty, handleSave, discard)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((p) => ({ ...p, avatar: "Use JPG, PNG, or WebP." }))
      return
    }
    setUploadingAvatar(true)
    setErrors((p) => ({ ...p, avatar: "" }))
    try {
      const res = await uploadUserAvatar(file)
      const url = resolveMediaUrl(res.avatar_url)
      if (url) setDraft((p) => ({ ...p, avatarDataUrl: url }))
      await queryClient.invalidateQueries({ queryKey: ["current-user"] })
      showToast("Avatar updated ✓")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Avatar upload failed",
        "error"
      )
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const avatarSrc = draft.avatarDataUrl

  return (
    <SettingsPanel
      title="Profile"
      description="Update how others see you on OpinionPulse."
      onSave={handleSave}
      saving={saving}
    >
      <FormField label="Profile photo" htmlFor="avatar-upload">
        <div className="flex items-center gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-500 to-indigo-600">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">
                {draft.fullName.charAt(0).toUpperCase() || "?"}
              </span>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition-colors duration-200",
              "hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30",
              uploadingAvatar && "pointer-events-none opacity-60"
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
            disabled={uploadingAvatar}
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
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
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
          <p className="mt-1 text-xs text-gray-400">Checking availability…</p>
        )}
      </FormField>

      <FormField label="Email" htmlFor="email">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="email"
            type="email"
            value={draft.email}
            readOnly
            className={cn(inputClass, "flex-1 bg-gray-100")}
            aria-describedby="email-status"
          />
          <Badge
            id="email-status"
            className={
              userQuery.data?.is_email_verified
                ? "border-green-200 bg-green-100 text-green-700"
                : "border-yellow-200 bg-yellow-100 text-yellow-700"
            }
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
        <p className="mt-1 text-right text-xs text-gray-400">{draft.bio.length}/160</p>
      </FormField>
    </SettingsPanel>
  )
}
