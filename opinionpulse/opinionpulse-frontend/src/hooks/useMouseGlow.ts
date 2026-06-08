import { useRef, useCallback } from "react"

export function useMouseGlow() {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    card.style.setProperty("--mouse-x", `${x}%`)
    card.style.setProperty("--mouse-y", `${y}%`)
    card.style.setProperty("--glow-opacity", "1")
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty("--glow-opacity", "0")
  }, [])

  return { cardRef, handleMouseMove, handleMouseLeave }
}
