import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Bookmark,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  Lock,
  MessageCircle,
  Search,
  Settings,
  Trash2,
} from "lucide-react"
import { ApiError } from "@/api/client"
import { getAccountProfile, updateAccountPassword } from "@/api/account"
import { getUserStats, uploadUserAvatar } from "@/api/users"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { PageSection } from "@/components/layout/PageSection"
import { StatCard } from "@/components/layout/StatCard"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/LoadingState"
import { useToast } from "@/components/ui/toast"
import { formatNumber, formatTimeAgo, resolveMediaUrl } from "@/lib/formatUtils"
import {
  btnPrimary,
  inputSurface,
  labelText,
  proCard,
  sectionTitle,
} from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function MyAccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const profileQuery = useQuery({
    queryKey: ["account-profile"],
    queryFn: getAccountProfile,
  })

  const statsQuery = useQuery({
    queryKey: ["user-stats"],
    queryFn: getUserStats,
  })

  const passwordMutation = useMutation({
    mutationFn: () =>
      updateAccountPassword({
        current_password: passwords.current,
        new_password: passwords.new,
        confirm_password: passwords.confirm,
      }),
    onSuccess: () => {
      setPasswordError(null)
      setPasswordSuccess(true)
      setPasswords({ current: "", new: "", confirm: "" })
      setTimeout(() => setPasswordSuccess(false), 4000)
    },
    onError: (err) => {
      setPasswordSuccess(false)
      setPasswordError(err instanceof ApiError ? err.detail : "Password update failed")
    },
  })

  const userProfile = profileQuery.data
  const stats = statsQuery.data
  const avatarUrl = resolveMediaUrl(userProfile?.avatar_url)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      await uploadUserAvatar(file)
      await queryClient.invalidateQueries({ queryKey: ["account-profile"] })
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

  function handlePasswordChange() {
    setPasswordError(null)
    setPasswordSuccess(false)
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError("Please fill in all password fields.")
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords do not match.")
      return
    }
    passwordMutation.mutate()
  }

  function handleExportData() {
    const exportData = {
      profile: userProfile,
      stats,
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `opinionpulse-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Data exported ✓")
  }

  if (profileQuery.isLoading) {
    return (
      <DashboardLayout
        title="My Account"
        subtitle="Manage your profile and account settings"
      >
        <LoadingState label="Loading account…" />
      </DashboardLayout>
    )
  }

  const displayName = userProfile?.full_name || userProfile?.name || "User"

  return (
    <DashboardLayout
      title="My Account"
      subtitle="Manage your profile and account settings"
    >
      <div className={cn(proCard, "mb-8 overflow-hidden")}>
        <div className="border-b border-border bg-muted/20 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-primary text-2xl font-medium text-primary-foreground">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  displayName[0]?.toUpperCase() || "U"
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary transition-colors hover:bg-primary/90"
              >
                <Camera size={12} className="text-primary-foreground" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className={sectionTitle}>{displayName}</h2>
                {userProfile?.is_email_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/5 px-2 py-0.5 text-xs font-medium text-success">
                    <CheckCircle size={11} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-accent/50 px-2 py-0.5 text-xs font-medium text-foreground">
                    <AlertCircle size={11} />
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              {userProfile?.username && (
                <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Member since{" "}
                {userProfile?.created_at
                  ? new Date(userProfile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "Unknown"}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/settings#profile")}
              className="h-10 shrink-0 gap-2"
            >
              <Settings size={14} />
              Edit Profile
            </Button>
          </div>
        </div>

        {userProfile?.bio && (
          <p className="px-5 py-4 text-sm leading-relaxed text-muted-foreground sm:px-6">
            {userProfile.bio}
          </p>
        )}
      </div>

      <PageSection title="Activity" className="mb-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={Search}
            value={formatNumber(stats?.total_searches ?? 0)}
            label="Total Searches"
          />
          <StatCard
            icon={MessageCircle}
            value={formatNumber(stats?.total_chats ?? 0)}
            label="AI Conversations"
          />
          <StatCard
            icon={Bookmark}
            value={formatNumber(stats?.saved_searches ?? 0)}
            label="Saved Searches"
          />
          <StatCard
            icon={Clock}
            value={stats?.last_active ? formatTimeAgo(stats.last_active) : "Today"}
            label="Last Active"
          />
        </div>
      </PageSection>

      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <PageSection
          title="Change Password"
          description="Update your password to keep your account secure."
          className="mb-0"
        >
          <div className={cn(proCard, "space-y-4 bg-muted/20 p-5 sm:p-6")}>
            <PasswordField
              label="Current Password"
              value={passwords.current}
              onChange={(v) => setPasswords((p) => ({ ...p, current: v }))}
              placeholder="Enter current password"
            />
            <PasswordField
              label="New Password"
              value={passwords.new}
              onChange={(v) => setPasswords((p) => ({ ...p, new: v }))}
              placeholder="Enter new password"
            />
            <PasswordField
              label="Confirm New Password"
              value={passwords.confirm}
              onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
              placeholder="Confirm new password"
            />

            {passwordError && (
              <InlineNotice variant="warning" className="text-sm">
                {passwordError}
              </InlineNotice>
            )}
            {passwordSuccess && (
              <InlineNotice variant="success" className="text-sm">
                Password updated successfully
              </InlineNotice>
            )}

            <Button
              type="button"
              onClick={handlePasswordChange}
              disabled={passwordMutation.isPending}
              className={cn("w-full gap-2", btnPrimary)}
            >
              {passwordMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </PageSection>

        <PageSection title="Account Details" className="mb-0">
          <div className={cn(proCard, "bg-muted/20 p-5 sm:p-6")}>
            <div className="space-y-0">
              <DetailRow
                label="Full Name"
                value={displayName}
                actionLabel="Edit"
                onAction={() => navigate("/settings#profile")}
              />
              <div className="flex items-center justify-between border-b border-border py-3">
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">Email Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {userProfile?.email || "—"}
                    </p>
                    {userProfile?.is_email_verified && (
                      <span className="rounded-full border border-success/20 bg-success/5 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <DetailRow
                label="Username"
                value={
                  userProfile?.username
                    ? `@${userProfile.username}`
                    : "Not set"
                }
                actionLabel={userProfile?.username ? "Edit" : "Add"}
                onAction={() => navigate("/settings#profile")}
              />
              <div className="border-b border-border py-3">
                <p className="mb-0.5 text-xs text-muted-foreground">Account Role</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {userProfile?.role === "ADMIN" ? "Admin" : "User"}
                </span>
              </div>
              <div className="py-3">
                <p className="mb-0.5 text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium text-foreground">
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </PageSection>
      </div>

      <PageSection title="Quick Actions" className="mb-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction
            icon={Search}
            label="New Search"
            onClick={() => navigate("/search")}
          />
          <QuickAction
            icon={MessageCircle}
            label="Ask Pulse AI"
            onClick={() => navigate("/chat")}
          />
          <QuickAction
            icon={Settings}
            label="Settings"
            onClick={() => navigate("/settings")}
          />
          <QuickAction
            icon={BarChart2}
            label="View Reports"
            onClick={() => navigate("/reports")}
          />
        </div>
      </PageSection>

      <PageSection
        title="Danger Zone"
        description="These actions are permanent and cannot be undone."
        className="mb-0"
      >
        <div className={cn(proCard, "border-destructive/20 bg-destructive/5 p-5 sm:p-6")}>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportData}
              className="gap-2"
            >
              <Download size={14} />
              Export My Data
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="gap-2"
            >
              <Trash2 size={14} />
              Delete Account
            </Button>
          </div>
        </div>
      </PageSection>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={cn(proCard, "w-full max-w-md p-6 shadow-xl")}>
            <h3 className={cn(sectionTitle, "flex items-center gap-2")}>
              <AlertTriangle size={18} className="text-destructive" />
              Delete account?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Account deletion is not yet available. Contact support if you need
              your data removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setShowDeleteModal(false)
                  showToast("Account deletion is not yet available.", "error")
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className={cn(labelText, "mb-1.5 block text-xs")}>{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputSurface, "w-full")}
      />
    </div>
  )
}

function DetailRow({
  label,
  value,
  actionLabel,
  onAction,
}: {
  label: string
  value: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3">
      <div>
        <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="text-xs font-medium text-primary hover:underline"
      >
        {actionLabel}
      </button>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        proCard,
        "group flex flex-col items-center gap-2 bg-muted/20 p-4 transition-colors duration-150 hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      <Icon
        size={20}
        className="text-muted-foreground group-hover:text-primary"
      />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </button>
  )
}
