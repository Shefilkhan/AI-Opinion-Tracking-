import { cn } from "@/lib/utils"
import { inputSurface } from "@/lib/ui-classes"

export const authLabelClass = "mb-1.5 block text-sm font-medium text-foreground"

export function authInputClass(options?: {
  error?: boolean
  success?: boolean
}): string {
  return cn(
    inputSurface,
    "w-full rounded-[var(--radius-md)] px-4 py-3 min-h-[44px]",
    options?.error &&
      "border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20",
    options?.success &&
      !options?.error &&
      "border-success focus:border-success focus:ring-success/20"
  )
}

export const STRENGTH_HEX: Record<string, string> = {
  weak: "#dc2626",
  fair: "#c96442",
  good: "#ca8a04",
  strong: "#16a34a",
}

export const STRENGTH_LABELS: Record<string, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"
      />
    </svg>
  )
}
