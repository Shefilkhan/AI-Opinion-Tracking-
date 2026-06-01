import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return (
      <Navigate
        to={`/auth/signin?redirect=${redirect}`}
        replace
      />
    )
  }

  return <>{children}</>
}
