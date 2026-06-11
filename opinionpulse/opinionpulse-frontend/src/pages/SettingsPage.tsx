import { Navigate, useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SettingsLayout } from "@/components/settings/SettingsLayout"
import { isSettingsSectionId } from "@/components/settings/settingsNav"

function SettingsLegacyRedirect() {
  const { section } = useParams<{ section: string }>()
  if (section && isSettingsSectionId(section)) {
    return <Navigate to={`/settings#${section}`} replace />
  }
  return <Navigate to="/settings#profile" replace />
}

export function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <SettingsLayout />
    </DashboardLayout>
  )
}

export { SettingsLegacyRedirect }
