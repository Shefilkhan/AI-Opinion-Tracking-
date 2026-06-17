import { useEffect, useState } from "react"

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  )

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [breakpoint])

  return isMobile
}

export function useIsTablet(breakpoint = 1024) {
  const [isTablet, setIsTablet] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  )

  useEffect(() => {
    const handler = () => setIsTablet(window.innerWidth < breakpoint)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [breakpoint])

  return isTablet
}
