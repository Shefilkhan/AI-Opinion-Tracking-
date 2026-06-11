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

  root.classList.remove("dark", "light")
  if (appearance.theme === "light") {
    root.classList.add("light")
  } else if (appearance.theme === "dark") {
    root.classList.add("dark")
  } else if (resolved === "dark") {
    root.classList.add("dark")
  }

  localStorage.setItem("opinionpulse-theme", appearance.theme)
  root.style.setProperty("--primary", appearance.accentColor)
  root.style.setProperty("--accent-primary", appearance.accentColor)
  root.style.setProperty("--ring", appearance.accentColor)
  root.style.fontSize = FONT_SIZE_MAP[appearance.fontSize]
}

/** Apply saved theme before React mounts (FOUC prevention). */
export function initThemeOnStartup(): void {
  const stored = localStorage.getItem("opinionpulse_user_settings")
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { appearance?: AppearanceSettings }
      if (parsed.appearance) {
        applyAppearanceToDocument(parsed.appearance)
        return
      }
    } catch {
      /* fall through */
    }
  }

  const saved = localStorage.getItem("opinionpulse-theme") || "light"
  const root = document.documentElement
  root.classList.remove("dark", "light")
  if (saved === "dark") {
    root.classList.add("dark")
  } else if (saved === "light") {
    root.classList.add("light")
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.classList.add("dark")
  }
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
