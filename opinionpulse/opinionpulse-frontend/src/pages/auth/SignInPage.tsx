import { AuthLayout } from "@/components/auth/AuthLayout"
import { SignInForm } from "@/components/auth/SignInForm"

export function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard."
      footerText="Don't have an account?"
      footerLink="/auth/signup"
      footerLinkLabel="Sign up"
    >
      <SignInForm />
    </AuthLayout>
  )
}
