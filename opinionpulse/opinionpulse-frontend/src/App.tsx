import { Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { CreateProjectPage } from "@/pages/CreateProjectPage"
import { ProjectDetailPage } from "@/pages/ProjectDetailPage"
import { ProjectChatPage } from "@/pages/ProjectChatPage"
import { ProjectReportsPage } from "@/pages/ProjectReportsPage"
import { ProjectAlertsPage } from "@/pages/ProjectAlertsPage"
import { VerifyRegisterOtpPage } from "@/pages/VerifyRegisterOtpPage"
import { VerifyLoginOtpPage } from "@/pages/VerifyLoginOtpPage"
import { MentionsPage } from "@/pages/MentionsPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { MyAccountPage } from "@/pages/MyAccountPage"
import { SettingsLayout } from "@/components/settings/SettingsLayout"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { AccountSettings } from "@/components/settings/AccountSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { AppearanceSettings } from "@/components/settings/AppearanceSettings"
import { PrivacySettings } from "@/components/settings/PrivacySettings"
import { BillingSettings } from "@/components/settings/BillingSettings"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-register-otp" element={<VerifyRegisterOtpPage />} />
      <Route path="/verify-login-otp" element={<VerifyLoginOtpPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentions"
        element={
          <ProtectedRoute>
            <MentionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      >
        <Route element={<SettingsLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="appearance" element={<AppearanceSettings />} />
          <Route path="privacy" element={<PrivacySettings />} />
          <Route path="billing" element={<BillingSettings />} />
        </Route>
      </Route>
      <Route
        path="/my-account"
        element={
          <ProtectedRoute>
            <MyAccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute>
            <CreateProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/chat"
        element={
          <ProtectedRoute>
            <ProjectChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/reports"
        element={
          <ProtectedRoute>
            <ProjectReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/alerts"
        element={
          <ProtectedRoute>
            <ProjectAlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
