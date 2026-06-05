import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    particles: THREE.Points
    lines: THREE.LineSegments
    accentParticles: THREE.Points
    ring1: THREE.Mesh
    ring2: THREE.Mesh
    clock: THREE.Clock
  } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const isMobile = window.innerWidth < 768
    if (isMobile) {
      mount.style.background =
        "radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.15) 0%, transparent 60%)," +
        "radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.10) 0%, transparent 60%)"
      return
    }

    const scene = new THREE.Scene()
    const clock = new THREE.Clock()

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 28)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const NODE_COUNT = window.devicePixelRatio < 2 ? 80 : 120
    const SPREAD = 18

    const positions: number[] = []
    const nodePositions: THREE.Vector3[] = []

    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i

      const r = SPREAD * (0.7 + Math.random() * 0.6)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      positions.push(x, y, z)
      nodePositions.push(new THREE.Vector3(x, y, z))
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    )

    const particleMat = new THREE.PointsMaterial({
      color: 0x9d77f5,
      size: 0.35,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    const linePositions: number[] = []
    const lineColors: number[] = []
    const MAX_DIST = 9.5
    const MAX_CONNECTIONS = 3

    const connections: number[] = new Array(NODE_COUNT).fill(0)

    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (connections[i] >= MAX_CONNECTIONS) break
        if (connections[j] >= MAX_CONNECTIONS) continue

        const dist = nodePositions[i].distanceTo(nodePositions[j])
        if (dist < MAX_DIST) {
          const r1 = 0.45
          const g1 = 0.22
          const b1 = 0.95
          const r2 = 0.2
          const g2 = 0.45
          const b2 = 1.0

          linePositions.push(
            nodePositions[i].x,
            nodePositions[i].y,
            nodePositions[i].z,
            nodePositions[j].x,
            nodePositions[j].y,
            nodePositions[j].z
          )
          lineColors.push(r1, g1, b1, r2, g2, b2)

          connections[i]++
          connections[j]++
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3)
    )
    lineGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(lineColors, 3)
    )

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
    })

    const lines = new THREE.LineSegments(lineGeo, lineMat)
    scene.add(lines)

    const accentCount = 200
    const accentPos: number[] = []
    for (let i = 0; i < accentCount; i++) {
      accentPos.push(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40
      )
    }
    const accentGeo = new THREE.BufferGeometry()
    accentGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(accentPos, 3)
    )
    const accentMat = new THREE.PointsMaterial({
      color: 0x6d5ccc,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.45,
    })
    const accentParticles = new THREE.Points(accentGeo, accentMat)
    scene.add(accentParticles)

    const ring1Geo = new THREE.TorusGeometry(16, 0.04, 8, 100)
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.15,
    })
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat)
    ring1.rotation.x = Math.PI / 2
    scene.add(ring1)

    const ring2Geo = new THREE.TorusGeometry(16, 0.03, 8, 100)
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.1,
    })
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
    ring2.rotation.x = Math.PI / 3
    ring2.rotation.y = Math.PI / 6
    scene.add(ring2)

    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      lines,
      accentParticles,
      ring1,
      ring2,
      clock,
    }

    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener("mousemove", handleMouseMove)

    const handleResize = () => {
      if (!mount || !sceneRef.current) return
      const { camera: cam, renderer: ren } = sceneRef.current
      cam.aspect = mount.clientWidth / mount.clientHeight
      cam.updateProjectionMatrix()
      ren.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    const animate = () => {
      if (document.hidden) return

      animationRef.current = requestAnimationFrame(animate)
      if (!sceneRef.current) return

      const {
        particles: pts,
        lines: ln,
        accentParticles: accents,
        ring1: r1,
        ring2: r2,
        camera: cam,
        renderer: ren,
        scene: sc,
        clock: clk,
      } = sceneRef.current
      const elapsed = clk.getElapsedTime()

      pts.rotation.y = elapsed * 0.06
      pts.rotation.x = elapsed * 0.025
      ln.rotation.y = elapsed * 0.06
      ln.rotation.x = elapsed * 0.025
      accents.rotation.y = elapsed * 0.02
      accents.rotation.z = elapsed * 0.01
      r1.rotation.z = elapsed * 0.08
      r2.rotation.z = -elapsed * 0.05

      targetX += (mouseX * 1.5 - targetX) * 0.04
      targetY += (mouseY * 1.0 - targetY) * 0.04
      cam.position.x = targetX
      cam.position.y = -targetY

      const lineMaterial = ln.material as THREE.LineBasicMaterial
      lineMaterial.opacity = 0.18 + 0.1 * Math.sin(elapsed * 0.8)

      const particleMaterial = pts.material as THREE.PointsMaterial
      particleMaterial.opacity = 0.75 + 0.15 * Math.sin(elapsed * 1.2)

      cam.lookAt(0, 0, 0)
      ren.render(sc, cam)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        if (animationRef.current !== undefined) {
          cancelAnimationFrame(animationRef.current)
        }
      } else {
        animate()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    if (!document.hidden) {
      animate()
    }

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)

      renderer.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      lineGeo.dispose()
      lineMat.dispose()
      accentGeo.dispose()
      accentMat.dispose()
      ring1Geo.dispose()
      ring2Geo.dispose()
      ring1Mat.dispose()
      ring2Mat.dispose()

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }

      sceneRef.current = null
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  )
}
