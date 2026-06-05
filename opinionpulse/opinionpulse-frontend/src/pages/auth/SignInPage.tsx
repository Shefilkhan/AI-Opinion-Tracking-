import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { SignInForm } from "@/components/auth/SignInForm"

export function SignInPage() {
  return (
    <AuthSplitLayout
      variant="signin"
      topLink={{
        text: "Don't have an account?",
        href: "/auth/signup",
        label: "Sign up",
      }}
    >
      <SignInForm />
    </AuthSplitLayout>
  )
}
