import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppearanceProvider } from "@/contexts/AppearanceContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import {
  initAppearanceListeners,
  initThemeOnStartup,
} from "@/lib/applyAppearance"
import "./index.css"
import App from "./App.tsx"

const queryClient = new QueryClient()

initThemeOnStartup()

function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => initAppearanceListeners(), [])
  return (
    <ToastProvider>
      <AuthProvider>
        <AppearanceProvider>{children}</AppearanceProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppProviders>
            <App />
          </AppProviders>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
