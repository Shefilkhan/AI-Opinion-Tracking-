import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppearanceProvider } from "@/contexts/AppearanceContext"
import { ToastProvider } from "@/components/ui/toast"
import { applyAppearanceToDocument, initAppearanceListeners } from "@/lib/applyAppearance"
import { loadUserSettings } from "@/lib/userSettingsStore"
import "./index.css"
import App from "./App.tsx"

const queryClient = new QueryClient()

applyAppearanceToDocument(loadUserSettings().appearance)

function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => initAppearanceListeners(), [])
  return (
    <ToastProvider>
      <AppearanceProvider>{children}</AppearanceProvider>
    </ToastProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
