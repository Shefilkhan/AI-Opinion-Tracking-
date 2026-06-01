import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"
import { ApiError } from "@/api/client"
import {
  getAccountProfile,
  getAccountStats,
  updateAccountPassword,
  updateAccountProfile,
} from "@/api/account"
import { logoutUser } from "@/api/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/LoadingState"
import { cardSurface, inputSurface, btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function MyAccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: ["account-profile"],
    queryFn: getAccountProfile,
  })

  const statsQuery = useQuery({
    queryKey: ["account-stats"],
    queryFn: getAccountStats,
  })

  const profileMutation = useMutation({
    mutationFn: () => updateAccountProfile({ name: name.trim() }),
    onSuccess: () => {
      setProfileError(null)
      setProfileSuccess("Profile updated.")
      queryClient.invalidateQueries({ queryKey: ["account-profile"] })
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
    onError: (err) => {
      setProfileError(err instanceof ApiError ? err.detail : "Update failed")
    },
  })

  const passwordMutation = useMutation({
    mutationFn: () =>
      updateAccountPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    onSuccess: () => {
      setPasswordError(null)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setProfileSuccess("Password updated.")
    },
    onError: (err) => {
      setPasswordError(err instanceof ApiError ? err.detail : "Password update failed")
    },
  })

  const profile = profileQuery.data

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name)
    }
  }, [profile?.name])

  if (profileQuery.isLoading) {
    return (
      <DashboardLayout title="My Account">
        <LoadingState label="Loading account…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Account" subtitle="Profile and security">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle className="text-foreground">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Email: <span className="text-foreground">{profile?.email}</span>
            </p>
            <Badge
              className={
                profile?.is_email_verified
                  ? "bg-success/5 text-success"
                  : "bg-muted text-muted-foreground"
              }
            >
              {profile?.is_email_verified ? "Email verified" : "Not verified"}
            </Badge>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Display name</label>
              <input
                value={name || profile?.name || ""}
                onChange={(e) => setName(e.target.value)}
                className={cn("w-full rounded-lg px-3 py-2 text-sm", inputSurface)}
              />
            </div>
            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            {profileSuccess && (
              <p className="text-sm text-success">{profileSuccess}</p>
            )}
            <Button
              className={btnPrimary}
              disabled={profileMutation.isPending}
              onClick={() => profileMutation.mutate()}
            >
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle className="text-foreground">Account statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <LoadingState label="Loading stats…" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Projects", statsQuery.data?.total_projects],
                  ["Mentions", statsQuery.data?.total_mentions],
                  ["Analyzed", statsQuery.data?.total_analyzed],
                  ["Reports", statsQuery.data?.total_reports],
                  ["Chat sessions", statsQuery.data?.total_chat_sessions],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cn(cardSurface, "lg:col-span-2")}>
          <CardHeader>
            <CardTitle className="text-foreground">Change password</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={cn("rounded-lg px-3 py-2 text-sm", inputSurface)}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={cn("rounded-lg px-3 py-2 text-sm", inputSurface)}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn("rounded-lg px-3 py-2 text-sm", inputSurface)}
            />
            {passwordError && (
              <p className="text-sm text-destructive sm:col-span-3">{passwordError}</p>
            )}
            <Button
              variant="outline"
              disabled={passwordMutation.isPending}
              onClick={() => passwordMutation.mutate()}
              className="sm:col-span-3 sm:w-auto"
            >
              Update password
            </Button>
          </CardContent>
        </Card>

        <Card className={cn(cardSurface, "lg:col-span-2")}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="text-sm text-muted-foreground">
              Member since{" "}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"}
            </div>
            <Button
              variant="outline"
              className="gap-2 text-destructive"
              onClick={() => {
                logoutUser()
                navigate("/")
              }}
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
