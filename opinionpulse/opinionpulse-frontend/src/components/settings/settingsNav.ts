import {
  Bell,
  CreditCard,
  Lock,
  Shield,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react"

export type SettingsSectionId =
  | "profile"
  | "account"
  | "notifications"
  | "appearance"
  | "privacy"
  | "billing"

export type SettingsNavItem = {
  id: SettingsSectionId
  label: string
  icon: LucideIcon
}

export type SettingsNavGroup = {
  label: string
  items: SettingsNavItem[]
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: "Account",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "account", label: "Account", icon: Shield },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "appearance", label: "Appearance", icon: Sun },
      { id: "privacy", label: "Privacy", icon: Lock },
    ],
  },
  {
    label: "Plan",
    items: [{ id: "billing", label: "Billing", icon: CreditCard }],
  },
]

export const SETTINGS_SECTIONS: SettingsNavItem[] = SETTINGS_NAV_GROUPS.flatMap(
  (g) => g.items
)

export const SETTINGS_SECTION_IDS: SettingsSectionId[] = SETTINGS_SECTIONS.map(
  (s) => s.id
)

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.includes(value as SettingsSectionId)
}
