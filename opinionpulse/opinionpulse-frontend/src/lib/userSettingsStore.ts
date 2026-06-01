/** Client-side settings — structured for future API sync */

export type ThemeMode = "light" | "dark" | "system"
export type FontSize = "small" | "medium" | "large"
export type ProfileVisibility = "public" | "private" | "friends"
export type BillingPlan = "free" | "pro" | "enterprise"

export type ProfileSettings = {
  fullName: string
  username: string
  email: string
  bio: string
  avatarDataUrl: string | null
}

export type NotificationSettings = {
  emailProductUpdates: boolean
  emailSecurityAlerts: boolean
  emailWeeklyDigest: boolean
  emailMarketing: boolean
  pushEnabled: boolean
  pushMentions: boolean
  pushAlerts: boolean
}

export type AppearanceSettings = {
  theme: ThemeMode
  accentColor: string
  fontSize: FontSize
}

export type PrivacySettings = {
  profileVisibility: ProfileVisibility
  showEmailOnProfile: boolean
  allowSearchIndexing: boolean
  allowUsageAnalytics: boolean
}

export type ConnectedAccount = {
  provider: "google" | "github"
  connected: boolean
  email?: string
}

export type AccountSettingsState = {
  twoFactorEnabled: boolean
  connectedAccounts: ConnectedAccount[]
}

export type BillingSettings = {
  plan: BillingPlan
  cardLast4: string
  cardBrand: string
}

export type WorkspaceSettings = {
  compactLayout: boolean
  defaultTrackingFrequency: "manual" | "daily" | "weekly"
  defaultSources: { reddit: boolean; youtube: boolean; gdelt: boolean }
}

export type UserSettings = {
  profile: ProfileSettings
  notifications: NotificationSettings
  appearance: AppearanceSettings
  privacy: PrivacySettings
  account: AccountSettingsState
  billing: BillingSettings
  workspace: WorkspaceSettings
}

const STORAGE_KEY = "opinionpulse_user_settings"

export const ACCENT_PRESETS = [
  { id: "blue", label: "Blue", value: "#0070f3" },
  { id: "violet", label: "Violet", value: "#7c3aed" },
  { id: "emerald", label: "Emerald", value: "#059669" },
  { id: "orange", label: "Orange", value: "#ea580c" },
  { id: "rose", label: "Rose", value: "#e11d48" },
  { id: "slate", label: "Slate", value: "#475569" },
] as const

const defaults: UserSettings = {
  profile: {
    fullName: "",
    username: "",
    email: "",
    bio: "",
    avatarDataUrl: null,
  },
  notifications: {
    emailProductUpdates: true,
    emailSecurityAlerts: true,
    emailWeeklyDigest: false,
    emailMarketing: false,
    pushEnabled: false,
    pushMentions: true,
    pushAlerts: true,
  },
  appearance: {
    theme: "light",
    accentColor: ACCENT_PRESETS[0].value,
    fontSize: "medium",
  },
  privacy: {
    profileVisibility: "public",
    showEmailOnProfile: false,
    allowSearchIndexing: true,
    allowUsageAnalytics: true,
  },
  account: {
    twoFactorEnabled: false,
    connectedAccounts: [
      { provider: "google", connected: false },
      { provider: "github", connected: false },
    ],
  },
  billing: {
    plan: "free",
    cardLast4: "4242",
    cardBrand: "Visa",
  },
  workspace: {
    compactLayout: false,
    defaultTrackingFrequency: "daily",
    defaultSources: { reddit: true, youtube: true, gdelt: true },
  },
}

function mergeLegacyWorkspace(parsed: Record<string, unknown>): WorkspaceSettings {
  const ws = { ...defaults.workspace }
  if (typeof parsed.compactLayout === "boolean") ws.compactLayout = parsed.compactLayout
  if (parsed.defaultTrackingFrequency === "manual" || parsed.defaultTrackingFrequency === "daily" || parsed.defaultTrackingFrequency === "weekly") {
    ws.defaultTrackingFrequency = parsed.defaultTrackingFrequency
  }
  if (parsed.defaultSources && typeof parsed.defaultSources === "object") {
    const ds = parsed.defaultSources as Record<string, boolean>
    ws.defaultSources = {
      reddit: ds.reddit ?? ws.defaultSources.reddit,
      youtube: ds.youtube ?? ws.defaultSources.youtube,
      gdelt: ds.gdelt ?? ws.defaultSources.gdelt,
    }
  }
  return ws
}

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem("opinionpulse_settings")
      if (legacy) {
        const legacyParsed = JSON.parse(legacy) as Record<string, unknown>
        return { ...defaults, workspace: mergeLegacyWorkspace(legacyParsed) }
      }
      return structuredClone(defaults)
    }
    const parsed = JSON.parse(raw) as Partial<UserSettings>
    return {
      profile: { ...defaults.profile, ...parsed.profile },
      notifications: { ...defaults.notifications, ...parsed.notifications },
      appearance: { ...defaults.appearance, ...parsed.appearance },
      privacy: { ...defaults.privacy, ...parsed.privacy },
      account: {
        ...defaults.account,
        ...parsed.account,
        connectedAccounts:
          parsed.account?.connectedAccounts ?? defaults.account.connectedAccounts,
      },
      billing: { ...defaults.billing, ...parsed.billing },
      workspace: parsed.workspace
        ? { ...defaults.workspace, ...parsed.workspace }
        : defaults.workspace,
    }
  } catch {
    return structuredClone(defaults)
  }
}

export function saveUserSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  localStorage.setItem(
    "opinionpulse_settings",
    JSON.stringify({
      compactLayout: settings.workspace.compactLayout,
      defaultTrackingFrequency: settings.workspace.defaultTrackingFrequency,
      defaultSources: settings.workspace.defaultSources,
    })
  )
}

export function saveSettingsSection<K extends keyof UserSettings>(
  section: K,
  data: UserSettings[K]
): UserSettings {
  const all = loadUserSettings()
  all[section] = data
  saveUserSettings(all)
  return all
}
