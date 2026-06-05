import { checkUsernameAvailable as apiCheckUsername } from "@/api/users"

export type PasswordStrength = "weak" | "fair" | "strong"

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return "weak"
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (score >= 4) return "strong"
  if (score >= 2) return "fair"
  return "weak"
}

export function validateUsername(username: string): string | null {
  const u = username.trim()
  if (!u) return null
  if (u.length < 3) return "Username must be at least 3 characters."
  if (u.length > 30) return "Username must be 30 characters or less."
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return "Use only letters, numbers, and underscores."
  return null
}

export function validateBio(bio: string): string | null {
  if (bio.length > 160) return "Bio must be 160 characters or less."
  return null
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const u = username.trim()
  if (!u || validateUsername(u)) return false
  try {
    const res = await apiCheckUsername(u)
    return res.available
  } catch {
    return false
  }
}
