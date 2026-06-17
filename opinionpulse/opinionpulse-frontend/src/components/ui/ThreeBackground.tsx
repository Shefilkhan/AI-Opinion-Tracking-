import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

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
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Particles (N = 200)
    const N = 200
    const pPos = new Float32Array(N * 3)
    const pVel = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 80
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 56
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 24
      pVel[i * 3] = (Math.random() - 0.5) * 0.02
      pVel[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.008
    }

    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.18,
      transparent: true,
      opacity: 0.68,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(pGeo, pMat)
    scene.add(points)

    // Line segments (MAX_L = 250)
    const MAX_L = 250
    const lPos = new Float32Array(MAX_L * 6)
    const lGeo = new THREE.BufferGeometry()
    lGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3))
    lGeo.setDrawRange(0, 0)
    const lMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.11,
    })
    const lines = new THREE.LineSegments(lGeo, lMat)
    scene.add(lines)

    // Icosahedrons
    const mkS = (r: number, d: number, c: number, op: number, x: number, y: number, z: number) => {
      const geo = new THREE.IcosahedronGeometry(r, d)
      const mat = new THREE.MeshBasicMaterial({
        color: c,
        wireframe: true,
        transparent: true,
        opacity: op,
      })
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      scene.add(m)
      return m
    }
    const s1 = mkS(9.5, 2, 0x1e40af, 0.14, 20, -2, -14)
    const s2 = mkS(5.8, 1, 0x6d28d9, 0.13, -22, 6, -9)
    const s3 = mkS(3.2, 1, 0x0e7490, 0.15, -4, -13, -5)

    // Toruses
    const mkT = (r: number, tb: number, c: number, op: number, x: number, y: number, z: number, rx: number, ry: number) => {
      const geo = new THREE.TorusGeometry(r, tb, 8, 90)
      const mat = new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: op,
      })
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      m.rotation.x = rx
      m.rotation.y = ry
      scene.add(m)
      return m
    }
    const t1 = mkT(11.5, 0.055, 0x06b6d4, 0.13, 20, -2, -14, 1.1, 0.2)
    const t2 = mkT(7.8, 0.05, 0x7c3aed, 0.11, -22, 6, -9, 0.7, 1.0)

    // Floating dots
    const aC = [0x3b82f6, 0x06b6d4, 0x7c3aed, 0x22c55e, 0x3b82f6, 0x06b6d4, 0x818cf8]
    const dG = new THREE.SphereGeometry(0.38, 8, 6)
    const aD: { mesh: THREE.Mesh; phase: number; baseOpacity: number }[] = []
    for (let i = 0; i < 7; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: aC[i],
        transparent: true,
        opacity: 0.8,
      })
      const d = new THREE.Mesh(dG, mat)
      d.position.set(
        (Math.random() - 0.5) * 65,
        (Math.random() - 0.5) * 44,
        (Math.random() - 0.5) * 10
      )
      scene.add(d)
      aD.push({ mesh: d, phase: Math.random() * Math.PI * 2, baseOpacity: 0.8 })
    }

    const t0 = Date.now()
    let currentTheme: "light" | "dark" | null = null

    const applySceneTheme = (theme: "light" | "dark") => {
      if (currentTheme === theme) return
      currentTheme = theme

      if (theme === "light") {
        pMat.color.setHex(0x2563eb); pMat.opacity = 0.5
        lMat.color.setHex(0x1e40af); lMat.opacity = 0.08
        ;(s1.material as THREE.MeshBasicMaterial).color.setHex(0x1e3a8a)
        ;(s1.material as THREE.MeshBasicMaterial).opacity = 0.2
        ;(s2.material as THREE.MeshBasicMaterial).color.setHex(0x4c1d95)
        ;(s2.material as THREE.MeshBasicMaterial).opacity = 0.17
        ;(s3.material as THREE.MeshBasicMaterial).color.setHex(0x0e7490)
        ;(s3.material as THREE.MeshBasicMaterial).opacity = 0.2
        ;(t1.material as THREE.MeshBasicMaterial).color.setHex(0x0369a1)
        ;(t1.material as THREE.MeshBasicMaterial).opacity = 0.16
        ;(t2.material as THREE.MeshBasicMaterial).color.setHex(0x5b21b6)
        ;(t2.material as THREE.MeshBasicMaterial).opacity = 0.14
      } else {
        pMat.color.setHex(0x60a5fa); pMat.opacity = 0.68
        lMat.color.setHex(0x3b82f6); lMat.opacity = 0.11
        ;(s1.material as THREE.MeshBasicMaterial).color.setHex(0x1e40af)
        ;(s1.material as THREE.MeshBasicMaterial).opacity = 0.14
        ;(s2.material as THREE.MeshBasicMaterial).color.setHex(0x6d28d9)
        ;(s2.material as THREE.MeshBasicMaterial).opacity = 0.13
        ;(s3.material as THREE.MeshBasicMaterial).color.setHex(0x0e7490)
        ;(s3.material as THREE.MeshBasicMaterial).opacity = 0.15
        ;(t1.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4)
        ;(t1.material as THREE.MeshBasicMaterial).opacity = 0.13
        ;(t2.material as THREE.MeshBasicMaterial).color.setHex(0x7c3aed)
        ;(t2.material as THREE.MeshBasicMaterial).opacity = 0.11
      }
    }

    // Mouse Tracking
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener("mousemove", handleMouseMove)

    // Resize
    const handleResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    // Visibility
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

    // Animation Loop
    const animate = () => {
      if (document.hidden) return
      animationRef.current = requestAnimationFrame(animate)

      // Sync theme colors
      const isDark = document.documentElement.classList.contains("dark")
      applySceneTheme(isDark ? "dark" : "light")

      const elapsed = (Date.now() - t0) * 0.001

      // 1. Move particles
      for (let i = 0; i < N; i++) {
        pPos[i * 3] += pVel[i * 3]
        pPos[i * 3 + 1] += pVel[i * 3 + 1]
        pPos[i * 3 + 2] += pVel[i * 3 + 2]

        if (Math.abs(pPos[i * 3]) > 40) pVel[i * 3] *= -1
        if (Math.abs(pPos[i * 3 + 1]) > 28) pVel[i * 3 + 1] *= -1
        if (Math.abs(pPos[i * 3 + 2]) > 12) pVel[i * 3 + 2] *= -1
      }
      pGeo.attributes.position.needsUpdate = true

      // 2. Compute connection lines
      let lc = 0
      const T2 = 11 * 11
      for (let i = 0; i < N && lc < MAX_L; i++) {
        for (let j = i + 1; j < N && lc < MAX_L; j++) {
          const dx = pPos[i * 3] - pPos[j * 3]
          const dy = pPos[i * 3 + 1] - pPos[j * 3 + 1]
          const dz = pPos[i * 3 + 2] - pPos[j * 3 + 2]
          if (dx * dx + dy * dy + dz * dz < T2) {
            const b = lc * 6
            lPos[b] = pPos[i * 3]
            lPos[b + 1] = pPos[i * 3 + 1]
            lPos[b + 2] = pPos[i * 3 + 2]
            lPos[b + 3] = pPos[j * 3]
            lPos[b + 4] = pPos[j * 3 + 1]
            lPos[b + 5] = pPos[j * 3 + 2]
            lc++
          }
        }
      }
      lGeo.setDrawRange(0, lc * 2)
      lGeo.attributes.position.needsUpdate = true

      // 3. Rotate meshes
      s1.rotation.y = elapsed * 0.11
      s1.rotation.x = elapsed * 0.068
      s2.rotation.y = -elapsed * 0.14
      s2.rotation.z = elapsed * 0.09
      s3.rotation.x = elapsed * 0.17
      s3.rotation.y = elapsed * 0.11

      t1.rotation.z = elapsed * 0.075
      t2.rotation.x = 0.7 + elapsed * 0.09

      // 4. Pulsate floating dots
      for (let i = 0; i < aD.length; i++) {
        const item = aD[i]
        ;(item.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.45 + 0.4 * Math.sin(elapsed * 1.1 + item.phase)
      }

      // 5. Track mouse & camera
      targetX += (mouseX * 1.8 - targetX) * 0.04
      targetY += (mouseY * 0.9 - targetY) * 0.04
      camera.position.x = Math.sin(elapsed * 0.09) * 1.8 + targetX
      camera.position.y = Math.cos(elapsed * 0.072) * 0.9 - targetY
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    // Run first animation frame
    animate()

    // Cleanup
    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)

      renderer.dispose()
      pGeo.dispose()
      pMat.dispose()
      lGeo.dispose()
      lMat.dispose()
      s1.geometry.dispose()
      ;(s1.material as THREE.Material).dispose()
      s2.geometry.dispose()
      ;(s2.material as THREE.Material).dispose()
      s3.geometry.dispose()
      ;(s3.material as THREE.Material).dispose()
      t1.geometry.dispose()
      ;(t1.material as THREE.Material).dispose()
      t2.geometry.dispose()
      ;(t2.material as THREE.Material).dispose()
      dG.dispose()
      for (let i = 0; i < aD.length; i++) {
        ;(aD[i].mesh.material as THREE.Material).dispose()
      }

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
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
