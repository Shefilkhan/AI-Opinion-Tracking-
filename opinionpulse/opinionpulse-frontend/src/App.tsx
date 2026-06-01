import { Navigate, Route, Routes, useSearchParams } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
import { VerifyOtpPage } from "@/pages/auth/VerifyOtpPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { CreateProjectPage } from "@/pages/CreateProjectPage"
import { ProjectDetailPage } from "@/pages/ProjectDetailPage"
import { ProjectChatPage } from "@/pages/ProjectChatPage"
import { ProjectReportsPage } from "@/pages/ProjectReportsPage"
import { ProjectAlertsPage } from "@/pages/ProjectAlertsPage"
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

function LegacyVerifyRedirect({ type }: { type: "signup" | "login" }) {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const redirect = searchParams.get("redirect") ?? "/dashboard"
  const qs = new URLSearchParams({
    type,
    email,
    redirect,
  })
  return <Navigate to={`/auth/verify-otp?${qs.toString()}`} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/auth/signup" element={<SignUpPage />} />
      <Route path="/auth/signin" element={<SignInPage />} />
      <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
      <Route path="/login" element={<Navigate to="/auth/signin" replace />} />
      <Route
        path="/verify-register-otp"
        element={<LegacyVerifyRedirect type="signup" />}
      />
      <Route
        path="/verify-login-otp"
        element={<LegacyVerifyRedirect type="login" />}
      />

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
