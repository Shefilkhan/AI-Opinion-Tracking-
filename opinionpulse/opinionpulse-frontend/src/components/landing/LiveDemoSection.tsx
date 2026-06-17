import { useRef, useState, useEffect } from "react"
import { ArrowDown, MousePointer2 } from "lucide-react"
import { DemoBrowserMock } from "@/components/landing/demo/DemoBrowserMock"
import { demoScrollSteps } from "@/data/demoShowcaseData"
import {
  demoTransforms,
  useDemoScrollProgress,
} from "@/hooks/useDemoScrollProgress"
import { cn } from "@/lib/utils"

export function LiveDemoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const progress = useDemoScrollProgress(sectionRef)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const { rotateX, rotateY, translateZ, scale, innerScroll, activeStep } =
    demoTransforms(progress, reducedMotion)

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="relative border-t border-border bg-muted/20 dark:bg-[#0a0a14]/50"
      style={{ minHeight: reducedMotion ? "auto" : "280vh" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-orb-purple absolute left-1/4 top-20 size-[28rem] opacity-30" />
        <div className="landing-orb-blue absolute bottom-20 right-1/4 size-80 opacity-25" />
      </div>

      <div
        className={cn(
          "mx-auto max-w-6xl px-6",
          reducedMotion ? "py-20" : "sticky top-16 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12"
        )}
      >
        <div className="relative z-10 mx-auto mb-10 max-w-2xl text-center">
          <p className="landing-badge inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            Interactive demo
          </p>
          <h2 className="mt-4 font-serif-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            See It In Action
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Real data, real sentiment, real insights
          </p>
          {!reducedMotion && progress < 0.92 && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary animate-pulse">
              <MousePointer2 className="size-4" />
              Scroll to explore the product
              <ArrowDown className="size-4" />
            </p>
          )}
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[160px_1fr] lg:gap-10">
          <ol className="hidden lg:flex lg:flex-col lg:gap-3 lg:pt-8">
            {demoScrollSteps.map((step, i) => (
              <li
                key={step.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm transition-all duration-300",
                  i === activeStep
                    ? "border-primary/40 bg-primary/10 font-semibold text-primary shadow-sm"
                    : i < activeStep
                      ? "border-border bg-card/50 text-muted-foreground"
                      : "border-transparent text-muted-foreground/60"
                )}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                  Step {i + 1}
                </span>
                <p className="mt-0.5">{step.label}</p>
              </li>
            ))}
          </ol>

          <div
            className="demo-stage mx-auto w-full max-w-5xl"
            style={{ perspective: reducedMotion ? "none" : "1400px" }}
          >
            <div
              className="demo-browser relative will-change-transform"
              style={{
                transformStyle: reducedMotion ? "flat" : "preserve-3d",
                transform: reducedMotion
                  ? undefined
                  : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`,
              }}
            >
              <div className="landing-glow-ring pointer-events-none absolute -inset-[4%] opacity-60" aria-hidden />
              <DemoBrowserMock innerScroll={innerScroll} />
            </div>
          </div>
        </div>

        {!reducedMotion && (
          <div className="relative z-10 mx-auto mt-8 h-1.5 max-w-md overflow-hidden rounded-full bg-muted dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 transition-[width] duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
