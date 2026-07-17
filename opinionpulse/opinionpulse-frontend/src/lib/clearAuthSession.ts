import { logoutUser } from "@/api/auth"
import { removeToken } from "@/lib/authStore"

/** Clear local token and server cookie session before a new sign-in. */
export async function clearAuthSession(): Promise<void> {
  removeToken()
  try {
    await logoutUser()
  } catch {
    removeToken()
  }
}
