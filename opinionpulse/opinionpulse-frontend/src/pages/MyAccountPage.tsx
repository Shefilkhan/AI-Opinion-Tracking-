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
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Trash2,
  User,
} from "lucide-react"
import { ApiError } from "@/api/client"
import { getAccountProfile, updateAccountPassword } from "@/api/account"
import { logoutUser } from "@/api/auth"
import { getUserStats, uploadUserAvatar } from "@/api/users"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { LoadingState } from "@/components/ui/LoadingState"
import { ParticleBackground } from "@/components/ui/ParticleBackground"
import { useToast } from "@/components/ui/toast"
import { formatNumber, formatTimeAgo, resolveMediaUrl } from "@/lib/formatUtils"

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

  function handleLogout() {
    logoutUser()
    navigate("/")
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
      <DashboardLayout title="" subtitle="" hidePageHeader>
        <LoadingState label="Loading account…" />
      </DashboardLayout>
    )
  }

  const displayName = userProfile?.full_name || userProfile?.name || "User"

  return (
    <DashboardLayout title="" subtitle="" hidePageHeader>
      <div className="relative min-h-full bg-gray-50 dark:bg-[#0f0f1a]">
        <ParticleBackground sentiment="neutral" intensity={0.15} />

        <div className="relative z-10 w-full">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Manage your profile and account settings
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2d2d44] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>

          <div className="mb-6 rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-2xl font-bold text-white">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
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
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-purple-600 transition-colors hover:bg-purple-50 dark:hover:bg-purple-500/100"
                >
                  <Camera size={12} className="text-white" />
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
                <div className="mb-1 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                  {userProfile?.is_email_verified ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <CheckCircle size={11} />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      <AlertCircle size={11} />
                      Unverified
                    </span>
                  )}
                </div>
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">{userProfile?.email}</p>
                {userProfile?.username && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">@{userProfile.username}</p>
                )}
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Member since{" "}
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : "Unknown"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/settings#profile")}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2d2d44] px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 dark:hover:border-[#3d3d5c] hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <Settings size={14} />
                Edit Profile
              </button>
            </div>

            {userProfile?.bio && (
              <p className="mt-4 border-t border-gray-100 dark:border-[#2d2d44] pt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {userProfile.bio}
              </p>
            )}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              icon={<Search size={18} className="text-purple-600" />}
              iconBg="bg-purple-100"
              value={formatNumber(stats?.total_searches ?? 0)}
              label="Total Searches"
            />
            <StatCard
              icon={<MessageCircle size={18} className="text-blue-600" />}
              iconBg="bg-blue-100"
              value={formatNumber(stats?.total_chats ?? 0)}
              label="AI Conversations"
            />
            <StatCard
              icon={<Bookmark size={18} className="text-green-600" />}
              iconBg="bg-green-100"
              value={formatNumber(stats?.saved_searches ?? 0)}
              label="Saved Searches"
            />
            <StatCard
              icon={<Clock size={18} className="text-orange-600" />}
              iconBg="bg-orange-100"
              value={
                stats?.last_active ? formatTimeAgo(stats.last_active) : "Today"
              }
              label="Last Active"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Lock size={15} className="text-gray-600 dark:text-gray-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
              </div>

              <div className="space-y-3">
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
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={11} />
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={11} />
                    Password updated successfully
                  </p>
                )}

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <User size={15} className="text-gray-600 dark:text-gray-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Account Details</h3>
              </div>

              <div className="space-y-4">
                <DetailRow
                  label="Full Name"
                  value={displayName}
                  actionLabel="Edit"
                  onAction={() => navigate("/settings#profile")}
                />
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d44] py-3">
                  <div>
                    <p className="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userProfile?.email || "—"}
                      </p>
                      {userProfile?.is_email_verified && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                          ✓ Verified
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
                <div className="border-b border-gray-100 dark:border-[#2d2d44] py-3">
                  <p className="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Account Role</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {userProfile?.role === "ADMIN" ? "👑 Admin" : "👤 User"}
                  </span>
                </div>
                <div className="py-3">
                  <p className="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
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
          </div>

          <div className="rounded-2xl border border-red-200 bg-white dark:bg-[#1e1e30] p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-red-600">
              <AlertTriangle size={16} />
              Danger Zone
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              These actions are permanent and cannot be undone.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2d2d44] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <Download size={14} />
                Export My Data
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete account?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Account deletion is not yet available. Contact support if you need
              your data removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-gray-200 dark:border-[#2d2d44] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  showToast("Account deletion is not yet available.", "error")
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function StatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] p-5 text-center shadow-sm">
      <div
        className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
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
      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 dark:border-[#2d2d44] bg-gray-50 dark:bg-[#252538] px-3 py-2.5 text-sm text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2a2a40] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d44] py-3">
      <div>
        <p className="mb-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="text-xs font-medium text-purple-600 hover:underline"
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
      className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2d2d44] p-4 transition-all hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-500/10"
    >
      <Icon
        size={20}
        className="text-gray-400 dark:text-gray-500 group-hover:text-purple-600"
      />
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-purple-700">
        {label}
      </span>
    </button>
  )
}
