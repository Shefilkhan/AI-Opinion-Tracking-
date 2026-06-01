import type { AppearanceSettings, FontSize } from "@/lib/userSettingsStore"

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "15px",
  large: "17px",
}

function resolveTheme(theme: AppearanceSettings["theme"]): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

export function applyAppearanceToDocument(appearance: AppearanceSettings): void {
  const root = document.documentElement
  const resolved = resolveTheme(appearance.theme)
  root.classList.toggle("dark", resolved === "dark")
  root.style.setProperty("--primary", appearance.accentColor)
  root.style.setProperty("--ring", appearance.accentColor)
  root.style.fontSize = FONT_SIZE_MAP[appearance.fontSize]
}

export function initAppearanceListeners(): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  const handler = () => {
    const settings = JSON.parse(
      localStorage.getItem("opinionpulse_user_settings") ?? "{}"
    ) as { appearance?: AppearanceSettings }
    if (settings.appearance?.theme === "system") {
      applyAppearanceToDocument(settings.appearance)
    }
  }
  mq.addEventListener("change", handler)
  return () => mq.removeEventListener("change", handler)
}
