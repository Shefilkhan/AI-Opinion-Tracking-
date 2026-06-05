import { Navigate, Route, Routes, useSearchParams } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { PricingPage } from "@/pages/PricingPage"
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
import { VerifyOtpPage } from "@/pages/auth/VerifyOtpPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { SearchPage } from "@/pages/SearchPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { AlertsPage } from "@/pages/AlertsPage"
import { SettingsPage, SettingsLegacyRedirect } from "@/pages/SettingsPage"
import { MyAccountPage } from "@/pages/MyAccountPage"
import { ChatPage } from "@/pages/ChatPage"
import { ChatBubble } from "@/components/chat/ChatBubble"

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
    <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />

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
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
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
      />
      <Route
        path="/settings/:section"
        element={
          <ProtectedRoute>
            <SettingsLegacyRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <MyAccountPage />
          </ProtectedRoute>
        }
      />
      <Route path="/my-account" element={<Navigate to="/account" replace />} />
      <Route path="/mentions" element={<Navigate to="/search" replace />} />
      <Route path="/projects" element={<Navigate to="/search" replace />} />
      <Route path="/projects/*" element={<Navigate to="/search" replace />} />
    </Routes>
    <ChatBubble />
    </>
  )
}

export default App
