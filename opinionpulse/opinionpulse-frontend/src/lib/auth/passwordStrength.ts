export type StrengthLevel = "weak" | "fair" | "good" | "strong"

export type PasswordRequirement = {
  id: string
  label: string
  met: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "upper",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      met: /\d/.test(password),
    },
    {
      id: "special",
      label: "One special character (!@#$%^&*)",
      met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ]
}

export function getPasswordStrength(password: string): {
  level: StrengthLevel
  score: number
} {
  const reqs = getPasswordRequirements(password)
  const met = reqs.filter((r) => r.met).length
  if (!password) return { level: "weak", score: 0 }
  if (met <= 1) return { level: "weak", score: 1 }
  if (met === 2) return { level: "fair", score: 2 }
  if (met === 3) return { level: "good", score: 3 }
  return { level: "strong", score: 4 }
}

export const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  weak: "bg-red-500",
  fair: "bg-orange-500",
  good: "bg-yellow-500",
  strong: "bg-green-500",
}
