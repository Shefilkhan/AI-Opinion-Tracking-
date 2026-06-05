import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function LandingContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</div>
  )
}

export function LandingLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-purple-600">
      {children}
    </p>
  )
}

export function LandingHeading({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2
      className={cn(
        "text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight text-gray-900",
        className
      )}
    >
      {children}
    </h2>
  )
}

export function LandingSubtext({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "mx-auto mt-3 max-w-[560px] text-base leading-relaxed text-gray-500",
        className
      )}
    >
      {children}
    </p>
  )
}
