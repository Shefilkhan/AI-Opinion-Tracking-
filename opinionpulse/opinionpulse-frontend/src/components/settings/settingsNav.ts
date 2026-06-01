import {
  Bell,
  CreditCard,
  Palette,
  Shield,
  User,
  UserCircle,
  type LucideIcon,
} from "lucide-react"

export type SettingsSectionId =
  | "profile"
  | "account"
  | "notifications"
  | "appearance"
  | "privacy"
  | "billing"

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId
  label: string
  href: string
  icon: LucideIcon
}[] = [
  { id: "profile", label: "Profile", href: "/settings/profile", icon: UserCircle },
  { id: "account", label: "Account", href: "/settings/account", icon: User },
  { id: "notifications", label: "Notifications", href: "/settings/notifications", icon: Bell },
  { id: "appearance", label: "Appearance", href: "/settings/appearance", icon: Palette },
  { id: "privacy", label: "Privacy", href: "/settings/privacy", icon: Shield },
  { id: "billing", label: "Billing", href: "/settings/billing", icon: CreditCard },
]
