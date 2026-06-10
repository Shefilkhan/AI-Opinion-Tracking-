import { useCallback, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "@/api/auth"
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
import { getSettingsStatus } from "@/api/settings"
import { updateAccountPassword } from "@/api/account"
import { ApiError } from "@/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, SettingsPanel } from "@/components/settings/SettingsPanel"
import { useRegisterSectionSave, useSectionDirty } from "@/components/settings/useSectionDirty"
import { useToast } from "@/components/ui/toast"
import {
  loadUserSettings,
  saveSettingsSection,
  type AccountSettingsState,
} from "@/lib/userSettingsStore"
import { getPasswordStrength } from "@/lib/settingsValidation"
import { inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const inputClass = cn(inputSurface, "h-11 w-full rounded-lg px-3 py-2")

type PasswordForm = {
  current: string
  next: string
  confirm: string
}

export function AccountSettings() {
  const { showToast } = useToast()
  const userQuery = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser })
  const statusQuery = useQuery({
    queryKey: ["settings-status"],
    queryFn: getSettingsStatus,
  })
  const confirmEmail = userQuery.data?.email ?? ""
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState("")

  const initialAccount = loadUserSettings().account
  const { draft, setDraft, dirty, commitSaved, discard } =
    useSectionDirty<AccountSettingsState>(initialAccount)

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  })

  const strength = getPasswordStrength(passwordForm.next)

  const handleSaveAccount = useCallback(async () => {
    setSaving(true)
    saveSettingsSection("account", draft)
    commitSaved(draft)
    setSaving(false)
    showToast("Account preferences saved.")
  }, [draft, commitSaved, showToast])

  useRegisterSectionSave("account", dirty, handleSaveAccount, discard)

  async function handlePasswordSave() {
    const errs: Record<string, string> = {}
    if (!passwordForm.current) errs.current = "Current password is required."
    if (passwordForm.next.length < 6) errs.next = "New password must be at least 6 characters."
    if (passwordForm.next !== passwordForm.confirm) errs.confirm = "Passwords do not match."
    setPasswordErrors(errs)
    if (Object.keys(errs).length > 0) return

    setPasswordSaving(true)
    try {
      await updateAccountPassword({
        current_password: passwordForm.current,
        new_password: passwordForm.next,
        confirm_password: passwordForm.confirm,
      })
      setPasswordForm({ current: "", next: "", confirm: "" })
      showToast("Password updated successfully.")
    } catch (err) {
      showToast(
        err instanceof ApiError ? String(err.detail) : "Could not update password.",
        "error"
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  function toggleProvider(provider: "google" | "github") {
    setDraft((prev) => ({
      ...prev,
      connectedAccounts: prev.connectedAccounts.map((a) =>
        a.provider === provider
          ? {
              ...a,
              connected: !a.connected,
              email: !a.connected ? "connected@example.com" : undefined,
            }
          : a
      ),
    }))
  }

  return (
    <>
      <SettingsPanel
        title="Account"
        description="Security, connected accounts, and integration status."
        onSave={handleSaveAccount}
        saving={saving}
        saveLabel="Save account preferences"
      >
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Change password</h3>
          <FormField label="Current password" htmlFor="current-pw" error={passwordErrors.current}>
            <Input
              id="current-pw"
              type="password"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, current: e.target.value }))
              }
              className={inputClass}
              autoComplete="current-password"
            />
          </FormField>
          <FormField label="New password" htmlFor="new-pw" error={passwordErrors.next}>
            <Input
              id="new-pw"
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
              className={inputClass}
              autoComplete="new-password"
            />
            {passwordForm.next && (
              <p className="mt-1 text-xs">
                Strength:{" "}
                <span
                  className={cn(
                    "font-medium capitalize",
                    strength === "strong" && "text-success",
                    strength === "fair" && "text-amber-600",
                    strength === "weak" && "text-destructive"
                  )}
                >
                  {strength}
                </span>
              </p>
            )}
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirm-pw" error={passwordErrors.confirm}>
            <Input
              id="confirm-pw"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, confirm: e.target.value }))
              }
              className={inputClass}
              autoComplete="new-password"
            />
          </FormField>
          <Button
            type="button"
            onClick={handlePasswordSave}
            disabled={passwordSaving}
            className="min-h-11 px-5 py-2.5"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Two-factor authentication
              </p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.twoFactorEnabled}
              onClick={() =>
                setDraft((p) => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500",
                draft.twoFactorEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow transition-transform",
                  draft.twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
          {draft.twoFactorEnabled && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Scan the QR code with your authenticator app (setup UI placeholder). In
              production, complete enrollment via your security provider.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Connected accounts</h3>
          {draft.connectedAccounts.map((acc) => (
            <div
              key={acc.provider}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                {acc.provider === "github" ? (
                  <GitHubIcon className="size-5" />
                ) : (
                  <span className="text-sm font-bold text-primary">G</span>
                )}
                <div>
                  <p className="text-sm font-medium capitalize">{acc.provider}</p>
                  {acc.connected && acc.email && (
                    <p className="text-xs text-muted-foreground">{acc.email}</p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant={acc.connected ? "outline" : "default"}
                className="min-h-11 px-4 py-2"
                onClick={() => toggleProvider(acc.provider)}
              >
                {acc.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </div>

        {statusQuery.data && (
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <h3 className="font-semibold text-foreground">API status</h3>
            {(
              [
                ["Backend", statusQuery.data.backend_connected],
                ["GDELT", statusQuery.data.gdelt_available],
                ["YouTube", statusQuery.data.youtube_configured],
                ["Reddit", statusQuery.data.reddit_configured],
                ["Email SMTP", statusQuery.data.email_configured],
              ] as const
            ).map(([label, ok]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <Badge className={ok ? "bg-success/5 text-success" : "bg-muted text-muted-foreground"}>
                  {ok ? "OK" : "Missing"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SettingsPanel>

      <SettingsPanel
        title="Danger zone"
        description="Irreversible actions for your account."
        showSave={false}
      >
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4 py-2"
            onClick={() => showToast("Data export started (demo).")}
          >
            Export my data
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 px-4 py-2"
            onClick={() => setDeleteOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </SettingsPanel>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className={cn("w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg")}>
            <h3 id="delete-account-title" className="text-lg font-semibold text-destructive">
              Delete account
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Type your email <strong>{confirmEmail}</strong> to confirm. This action
              cannot be undone.
            </p>
            <Input
              className={cn(inputClass, "mt-4")}
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Confirm email"
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="px-4 py-2"
                onClick={() => {
                  setDeleteOpen(false)
                  setDeleteEmail("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="px-4 py-2"
                disabled={
                  !confirmEmail ||
                  deleteEmail.trim().toLowerCase() !== confirmEmail.toLowerCase()
                }
                onClick={() => {
                  showToast("Account deletion is disabled in this demo.", "error")
                  setDeleteOpen(false)
                }}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
