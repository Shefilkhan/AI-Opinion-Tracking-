import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { getCurrentUser, logoutUser, type User } from "@/api/auth"
import { ApiError } from "@/api/client"
import { getToken, removeToken } from "@/lib/authStore"

type AuthContextValue = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await getCurrentUser()
      setUser(me)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        removeToken()
      }
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      refreshUser,
      setUser,
      logout,
    }),
    [user, loading, refreshUser, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
