import { useEffect, useRef } from "react"

export type ParticleSentiment = "positive" | "negative" | "neutral"

type ParticleBackgroundProps = {
  sentiment?: ParticleSentiment
  intensity?: number
}

type ColorSet = {
  node: string
  connection: string
  glow: string
  accent: string
}

const colorMap: Record<ParticleSentiment, ColorSet> = {
  positive: {
    node: "rgba(139, 92, 246, VAL)",
    connection: "rgba(109, 40, 217, VAL)",
    glow: "rgba(167, 139, 250, VAL)",
    accent: "rgba(52, 211, 153, VAL)",
  },
  negative: {
    node: "rgba(139, 92, 246, VAL)",
    connection: "rgba(109, 40, 217, VAL)",
    glow: "rgba(167, 139, 250, VAL)",
    accent: "rgba(248, 113, 113, VAL)",
  },
  neutral: {
    node: "rgba(139, 92, 246, VAL)",
    connection: "rgba(109, 40, 217, VAL)",
    glow: "rgba(167, 139, 250, VAL)",
    accent: "rgba(96, 165, 250, VAL)",
  },
}

function colorWithAlpha(template: string, alpha: number): string {
  return template.replace("VAL", alpha.toFixed(2))
}

type SimParticle = {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  pulse: number
  pulseSpeed: number
  isAccent: boolean
  reset: (randomY?: boolean) => void
  update: () => void
  draw: () => void
}

export function ParticleBackground({
  sentiment = "neutral",
  intensity = 0.4,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<SimParticle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReducedMotion) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cvs = canvas
    const context = ctx

    cvs.style.willChange = "transform"

    const resize = () => {
      cvs.width = window.innerWidth
      cvs.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const colors = colorMap[sentiment] ?? colorMap.neutral
    const c = colorWithAlpha

    class Particle {
      x = 0
      y = 0
      size = 1
      speedX = 0
      speedY = 0
      opacity = 0.2
      pulse = 0
      pulseSpeed = 0.01
      isAccent = false

      constructor(randomY = false) {
        this.reset(randomY)
      }

      reset(randomY = false) {
        this.x = Math.random() * cvs.width
        this.y = randomY
          ? Math.random() * cvs.height
          : cvs.height + 10
        this.size = Math.random() * 2 + 1
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = -(Math.random() * 0.4 + 0.1)
        this.opacity = Math.random() * 0.4 + 0.1
        this.pulse = Math.random() * Math.PI * 2
        this.pulseSpeed = Math.random() * 0.02 + 0.005
        this.isAccent = Math.random() < 0.15
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.pulse += this.pulseSpeed

        if (this.x < -10) this.x = cvs.width + 10
        if (this.x > cvs.width + 10) this.x = -10
        if (this.y < -10) this.reset(false)
      }

      draw() {
        const pulseOpacity = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse))
        const baseColor = this.isAccent ? colors.accent : colors.node

        const gradient = context.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size * 3
        )
        gradient.addColorStop(0, c(baseColor, pulseOpacity * 0.8))
        gradient.addColorStop(0.5, c(baseColor, pulseOpacity * 0.3))
        gradient.addColorStop(1, c(baseColor, 0))

        context.beginPath()
        context.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
        context.fillStyle = gradient
        context.fill()

        context.beginPath()
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        context.fillStyle = c(baseColor, pulseOpacity)
        context.fill()
      }
    }

    const particleCount = Math.min(
      window.innerWidth < 768 ? 40 : 80,
      Math.floor((cvs.width * cvs.height) / 12000),
      80
    )

    particlesRef.current = Array.from(
      { length: particleCount },
      () => new Particle(true)
    )

    const MAX_DIST = 120
    const MAX_LINES = 3
    const BASE_OPACITY = 0.15

    const drawConnections = (particles: SimParticle[]) => {
      for (let i = 0; i < particles.length; i++) {
        let lineCount = 0
        for (let j = i + 1; j < particles.length; j++) {
          if (lineCount >= MAX_LINES) break
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < MAX_DIST) {
            const alpha = BASE_OPACITY * (1 - dist / MAX_DIST)
            context.beginPath()
            context.moveTo(particles[i].x, particles[i].y)
            context.lineTo(particles[j].x, particles[j].y)
            context.strokeStyle = c(colors.connection, alpha)
            context.lineWidth = 0.5
            context.stroke()
            lineCount++
          }
        }
      }
    }

    const animate = () => {
      context.clearRect(0, 0, cvs.width, cvs.height)
      const particles = particlesRef.current
      drawConnections(particles)
      particles.forEach((p) => {
        p.update()
        p.draw()
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationRef.current)
      } else {
        animate()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [sentiment])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out"
      style={{ opacity: intensity }}
      aria-hidden
    />
  )
}
