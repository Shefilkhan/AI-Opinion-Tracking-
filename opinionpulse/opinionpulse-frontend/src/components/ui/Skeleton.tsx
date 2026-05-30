import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-800/60",
        className
      )}
    />
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className={cn("rounded-xl p-6", cardSurface)}>
      <Skeleton className="mb-3 h-5 w-2/3" />
      <Skeleton className="mb-4 h-4 w-full" />
      <Skeleton className="mb-6 h-3 w-1/3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="size-8" />
      </div>
    </div>
  )
}
