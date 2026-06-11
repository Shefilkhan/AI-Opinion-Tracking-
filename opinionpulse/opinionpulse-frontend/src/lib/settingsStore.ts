const KEY = "opinionpulse_settings"

export type LocalSettings = {
  compactLayout: boolean
  defaultTrackingFrequency: "manual" | "daily" | "weekly"
  defaultSources: { reddit: boolean; youtube: boolean; gdelt: boolean }
}

const defaults: LocalSettings = {
  compactLayout: false,
  defaultTrackingFrequency: "daily",
  defaultSources: { reddit: true, youtube: true, gdelt: true },
}

export function loadSettings(): LocalSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveSettings(settings: LocalSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
