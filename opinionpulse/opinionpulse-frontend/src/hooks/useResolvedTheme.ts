import { useEffect, useState } from "react"
import { useAppearance } from "@/contexts/AppearanceContext"

export function useResolvedTheme(): "light" | "dark" {
  const { appearance } = useAppearance()
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    resolveTheme(appearance.theme)
  )

  useEffect(() => {
    if (appearance.theme !== "system") {
      setResolved(appearance.theme)
      return
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setResolved(mq.matches ? "dark" : "light")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [appearance.theme])

  return resolved
}

function resolveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}
