import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { applyAppearanceToDocument } from "@/lib/applyAppearance"
import {
  loadUserSettings,
  saveSettingsSection,
  type AppearanceSettings,
} from "@/lib/userSettingsStore"

type AppearanceContextValue = {
  appearance: AppearanceSettings
  setAppearance: (next: AppearanceSettings) => void
  updateAppearance: (patch: Partial<AppearanceSettings>) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(
    () => loadUserSettings().appearance
  )

  useEffect(() => {
    applyAppearanceToDocument(appearance)
  }, [appearance])

  const setAppearance = useCallback((next: AppearanceSettings) => {
    setAppearanceState(next)
    saveSettingsSection("appearance", next)
    applyAppearanceToDocument(next)
  }, [])

  const updateAppearance = useCallback((patch: Partial<AppearanceSettings>) => {
    setAppearanceState((prev) => {
      const next = { ...prev, ...patch }
      saveSettingsSection("appearance", next)
      applyAppearanceToDocument(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ appearance, setAppearance, updateAppearance }),
    [appearance, setAppearance, updateAppearance]
  )

  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider")
  return ctx
}
