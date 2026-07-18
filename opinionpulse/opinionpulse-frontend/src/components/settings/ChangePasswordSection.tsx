import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { updateAccountPassword } from "@/api/account"
import {
  forgotPassword,
  resetPassword,
  verifyPasswordResetOtp,
} from "@/api/auth"
import { ApiError } from "@/api/client"
import { OtpInput } from "@/components/auth/OtpInput"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { PageSection } from "@/components/layout/PageSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/settings/SettingsPanel"
import { useToast } from "@/components/ui/toast"
import { maskEmail } from "@/lib/auth/maskEmail"
import { getPasswordStrength } from "@/lib/settingsValidation"
import { inputSurface, proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const inputClass = cn(inputSurface, "h-10 w-full px-3")

type PasswordMode = "current" | "otp"

type ChangePasswordSectionProps = {
  email: string
}

export function ChangePasswordSection({ email }: ChangePasswordSectionProps) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<PasswordMode>("current")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strength = getPasswordStrength(newPassword)

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAccountPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
      showToast("Password updated successfully.")
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) => {
      showToast(
        err instanceof ApiError ? String(err.detail) : "Could not update password.",
        "error"
      )
    },
  })

  const sendOtpMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (res) => {
      setOtpSent(true)
      setOtpCode("")
      setDevOtpCode(res.dev_otp_code ?? null)
      showToast("Verification code sent to your email.")
    },
    onError: () => {
      showToast("Could not send verification code. Try again.", "error")
    },
  })

  const resetMutation = useMutation({
    mutationFn: async () => {
      await verifyPasswordResetOtp(email, otpCode)
      return resetPassword({
        email,
        otp_code: otpCode,
        new_password: newPassword,
      })
    },
    onSuccess: () => {
      setOtpCode("")
      setNewPassword("")
      setConfirmPassword("")
      setOtpSent(false)
      setDevOtpCode(null)
      setErrors({})
      setMode("current")
      showToast("Password updated successfully.")
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) => {
      showToast(
        err instanceof ApiError ? String(err.detail) : "Could not reset password.",
        "error"
      )
    },
  })

  function switchMode(next: PasswordMode) {
    setMode(next)
    setErrors({})
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setOtpCode("")
    setOtpSent(false)
    setDevOtpCode(null)
  }

  function handleUpdateWithCurrent() {
    const nextErrors: Record<string, string> = {}
    if (!currentPassword) nextErrors.current = "Current password is required."
    if (newPassword.length < 8) nextErrors.new = "New password must be at least 8 characters."
    if (newPassword !== confirmPassword) nextErrors.confirm = "Passwords do not match."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    updateMutation.mutate()
  }

  function handleResetWithOtp() {
    const nextErrors: Record<string, string> = {}
    if (!otpSent) nextErrors.otp = "Send a verification code first."
    if (otpCode.length !== 6) nextErrors.otp = "Enter the 6-digit code from your email."
    if (newPassword.length < 8) nextErrors.new = "New password must be at least 8 characters."
    if (newPassword !== confirmPassword) nextErrors.confirm = "Passwords do not match."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    resetMutation.mutate()
  }

  return (
    <PageSection
      title="Change password"
      description="Update your password or reset it with a verification code if you forgot your current one."
      className="mb-0"
    >
      <div className={cn(proCard, "space-y-4 bg-muted/20 p-4 sm:p-5")}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => switchMode("current")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "current"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            I know my password
          </button>
          <button
            type="button"
            onClick={() => switchMode("otp")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "otp"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Forgot password
          </button>
        </div>

        {mode === "current" ? (
          <>
            <FormField label="Current password" htmlFor="privacy-current-pw" error={errors.current}>
              <Input
                id="privacy-current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </FormField>
            <FormField label="New password" htmlFor="privacy-new-pw" error={errors.new}>
              <Input
                id="privacy-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
              {newPassword && (
                <p className="text-xs">
                  Strength:{" "}
                  <span
                    className={cn(
                      "font-medium capitalize",
                      strength === "strong" && "text-success",
                      strength === "fair" && "text-primary",
                      strength === "weak" && "text-destructive"
                    )}
                  >
                    {strength}
                  </span>
                </p>
              )}
            </FormField>
            <FormField label="Confirm new password" htmlFor="privacy-confirm-pw" error={errors.confirm}>
              <Input
                id="privacy-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </FormField>
            <Button
              type="button"
              onClick={handleUpdateWithCurrent}
              disabled={updateMutation.isPending}
              className="min-h-10 px-5"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a 6-digit code to{" "}
              <span className="font-medium text-foreground">{maskEmail(email)}</span>.
            </p>
            {!otpSent ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => sendOtpMutation.mutate()}
                disabled={sendOtpMutation.isPending || !email}
                className="min-h-10 px-5"
              >
                {sendOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send verification code"
                )}
              </Button>
            ) : (
              <>
                {devOtpCode && (
                  <InlineNotice variant="info" className="text-sm">
                    Dev mode: your code is <strong>{devOtpCode}</strong>
                  </InlineNotice>
                )}
                <FormField label="Verification code" htmlFor="privacy-otp" error={errors.otp}>
                  <OtpInput
                    value={otpCode}
                    onChange={setOtpCode}
                    autoFocus={false}
                    hasError={Boolean(errors.otp)}
                  />
                </FormField>
                <FormField label="New password" htmlFor="privacy-otp-new-pw" error={errors.new}>
                  <Input
                    id="privacy-otp-new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="Confirm new password" htmlFor="privacy-otp-confirm-pw" error={errors.confirm}>
                  <Input
                    id="privacy-otp-confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleResetWithOtp}
                    disabled={resetMutation.isPending}
                    className="min-h-10 px-5"
                  >
                    {resetMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => sendOtpMutation.mutate()}
                    disabled={sendOtpMutation.isPending}
                    className="min-h-10 px-5"
                  >
                    Resend code
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageSection>
  )
}
