import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type UpgradeModalState = {
  isOpen: boolean
  message: string
  upgradeTo: string
  open: (message: string, upgradeTo?: string) => void
  close: () => void
}

const UpgradeModalContext = createContext<UpgradeModalState | null>(null)

let externalOpen: ((message: string, upgradeTo?: string) => void) | null = null

export function registerUpgradeModalHandler(
  handler: (message: string, upgradeTo?: string) => void
) {
  externalOpen = handler
}

export function triggerUpgradeModal(message: string, upgradeTo = "pro") {
  externalOpen?.(message, upgradeTo)
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [upgradeTo, setUpgradeTo] = useState("pro")

  const open = useCallback((msg: string, plan = "pro") => {
    setMessage(msg)
    setUpgradeTo(plan)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    registerUpgradeModalHandler(open)
  }, [open])

  const value = useMemo(
    () => ({ isOpen, message, upgradeTo, open, close }),
    [isOpen, message, upgradeTo, open, close]
  )

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
    </UpgradeModalContext.Provider>
  )
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext)
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider")
  }
  return ctx
}
