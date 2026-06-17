import type { AppearanceSettings, FontSize } from "@/lib/userSettingsStore"

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "15px",
  large: "17px",
}

const DEFAULT_ACCENT = "#2f3a2f"

function resolveTheme(theme: AppearanceSettings["theme"]): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

let themeSwitchTimer: ReturnType<typeof setTimeout> | null = null

function beginThemeTransition(): void {
  const root = document.documentElement
  root.classList.add("theme-switching")
  if (themeSwitchTimer) clearTimeout(themeSwitchTimer)
  themeSwitchTimer = setTimeout(() => {
    root.classList.remove("theme-switching")
    themeSwitchTimer = null
  }, 420)
}

export function applyAppearanceToDocument(
  appearance: AppearanceSettings,
  options?: { animate?: boolean }
): void {
  const root = document.documentElement
  const resolved = resolveTheme(appearance.theme)

  if (options?.animate !== false) {
    beginThemeTransition()
  }

  root.classList.remove("dark", "light")
  if (appearance.theme === "light") {
    root.classList.add("light")
  } else if (appearance.theme === "dark") {
    root.classList.add("dark")
  } else if (resolved === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.add("light")
  }

  root.style.colorScheme = resolved

  localStorage.setItem("opinionpulse-theme", appearance.theme)

  const accent = appearance.accentColor || DEFAULT_ACCENT
  root.style.setProperty("--primary", accent)
  root.style.setProperty("--accent-primary", accent)
  root.style.setProperty("--ring", accent)
  root.style.fontSize = FONT_SIZE_MAP[appearance.fontSize]
}

/** Apply saved theme before React mounts (FOUC prevention). */
export function initThemeOnStartup(): void {
  const root = document.documentElement
  root.classList.add("no-theme-transition")

  const stored = localStorage.getItem("opinionpulse_user_settings")
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { appearance?: AppearanceSettings }
      if (parsed.appearance) {
        applyAppearanceToDocument(parsed.appearance, { animate: false })
        requestAnimationFrame(() => {
          root.classList.remove("no-theme-transition")
          root.dataset.appearanceReady = "1"
        })
        return
      }
    } catch {
      /* fall through */
    }
  }

  const saved = localStorage.getItem("opinionpulse-theme")
  root.classList.remove("dark", "light")
  if (saved === "dark") {
    root.classList.add("dark")
    root.style.colorScheme = "dark"
  } else {
    root.classList.add("light")
    root.style.colorScheme = "light"
  }

  requestAnimationFrame(() => {
    root.classList.remove("no-theme-transition")
    root.dataset.appearanceReady = "1"
  })
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
