import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type UnsavedEntry = {
  sectionId: string
  onSave: () => void | Promise<void>
  onDiscard: () => void
}

type SettingsUnsavedContextValue = {
  registerUnsaved: (entry: UnsavedEntry | null) => void
  activeUnsaved: UnsavedEntry | null
}

const SettingsUnsavedContext = createContext<SettingsUnsavedContextValue | null>(null)

export function SettingsUnsavedProvider({ children }: { children: ReactNode }) {
  const [activeUnsaved, setActiveUnsaved] = useState<UnsavedEntry | null>(null)

  const registerUnsaved = useCallback((entry: UnsavedEntry | null) => {
    setActiveUnsaved(entry)
  }, [])

  const value = useMemo(
    () => ({ registerUnsaved, activeUnsaved }),
    [registerUnsaved, activeUnsaved]
  )

  return (
    <SettingsUnsavedContext.Provider value={value}>
      {children}
    </SettingsUnsavedContext.Provider>
  )
}

export function useSettingsUnsaved() {
  const ctx = useContext(SettingsUnsavedContext)
  if (!ctx) throw new Error("useSettingsUnsaved must be used within SettingsUnsavedProvider")
  return ctx
}
