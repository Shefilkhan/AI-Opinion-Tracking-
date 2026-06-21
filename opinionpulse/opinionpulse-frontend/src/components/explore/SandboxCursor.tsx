import { useEffect, useRef, type RefObject } from "react"

type SandboxCursorProps = {
  containerRef: RefObject<HTMLDivElement | null>
}

export function SandboxCursor({ containerRef }: SandboxCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const cursor = cursorRef.current
    if (!container || !cursor) return

    function handleMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      cursor!.style.left = `${e.clientX - rect.left}px`
      cursor!.style.top = `${e.clientY - rect.top}px`
    }

    function handleEnter() {
      cursor!.style.opacity = "1"
    }

    function handleLeave() {
      cursor!.style.opacity = "0"
    }

    function handleDown() {
      cursor!.style.transform = "translate(-2px, -2px) scale(0.85)"
    }

    function handleUp() {
      cursor!.style.transform = "translate(-2px, -2px) scale(1)"
    }

    container.addEventListener("mousemove", handleMove)
    container.addEventListener("mouseenter", handleEnter)
    container.addEventListener("mouseleave", handleLeave)
    container.addEventListener("mousedown", handleDown)
    container.addEventListener("mouseup", handleUp)

    return () => {
      container.removeEventListener("mousemove", handleMove)
      container.removeEventListener("mouseenter", handleEnter)
      container.removeEventListener("mouseleave", handleLeave)
      container.removeEventListener("mousedown", handleDown)
      container.removeEventListener("mouseup", handleUp)
    }
  }, [containerRef])

  return (
    <div ref={cursorRef} className="sandbox-cursor" aria-hidden>
      <svg width="26" height="26" viewBox="0 0 26 26" className="sandbox-cursor-icon">
        <path
          d="M3 2 L3 21 L9 16.5 L12.5 24 L16 22.3 L12.5 14.8 L20 14.3 Z"
          fill="#7C3AED"
          stroke="white"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
