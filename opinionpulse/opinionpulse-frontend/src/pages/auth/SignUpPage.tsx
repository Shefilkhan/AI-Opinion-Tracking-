import { AuthLayout } from "@/components/auth/AuthLayout"
import { SignUpForm } from "@/components/auth/SignUpForm"

export function SignUpPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join OpinionPulse to track public opinion."
      footerText="Already have an account?"
      footerLink="/auth/signin"
      footerLinkLabel="Sign in"
    >
      <SignUpForm />
    </AuthLayout>
  )
}
