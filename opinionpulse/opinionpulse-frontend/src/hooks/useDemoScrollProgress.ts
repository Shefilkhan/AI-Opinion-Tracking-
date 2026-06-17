import { useEffect, useState, type RefObject } from "react"

export function useDemoScrollProgress(sectionRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const scrollable = Math.max(el.offsetHeight - window.innerHeight, 1)
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable)
      setProgress(scrolled / scrollable)
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [sectionRef])

  return progress
}

export function demoTransforms(progress: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      rotateX: 0,
      rotateY: 0,
      translateZ: 0,
      scale: 1,
      innerScroll: progress * 420,
      activeStep: Math.min(3, Math.floor(progress * 4)),
    }
  }

  const enter = Math.min(progress / 0.25, 1)
  const exit = progress > 0.75 ? (progress - 0.75) / 0.25 : 0

  return {
    rotateX: 22 * (1 - enter) - 6 * exit,
    rotateY: Math.sin(progress * Math.PI * 2) * 5,
    translateZ: -80 + enter * 80 - exit * 40,
    scale: 0.86 + enter * 0.14 - exit * 0.04,
    innerScroll: progress * 520,
    activeStep: Math.min(3, Math.floor(progress * 4)),
  }
}
