import { Outlet } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export function SettingsPage() {
  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <Outlet />
    </DashboardLayout>
  )
}
