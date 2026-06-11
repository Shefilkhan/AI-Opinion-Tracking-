import { Navigate, useLocation } from "react-router-dom"
import { AuthLoadingSkeleton } from "@/components/auth/AuthLoadingSkeleton"
import { useAuth } from "@/contexts/AuthContext"

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingSkeleton />
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
