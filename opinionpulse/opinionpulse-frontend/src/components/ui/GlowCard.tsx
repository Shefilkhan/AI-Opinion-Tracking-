import { useRef, useCallback, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GlowCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glowColor?: string
  onClick?: () => void
}

export default function GlowCard({
  children,
  className = "",
  style,
  glowColor = "139, 92, 246",
  onClick,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      card.style.setProperty("--mouse-x", `${x}%`)
      card.style.setProperty("--mouse-y", `${y}%`)
      card.style.setProperty("--glow-opacity", "1")
      card.style.setProperty("--glow-color", glowColor)
    },
    [glowColor]
  )

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty("--glow-opacity", "0")
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn("glow-card", className)}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div className="glow-card-content">{children}</div>
    </div>
  )
}
