import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type LoadingStateProps = {
  label?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "size-5",
  md: "size-8",
  lg: "size-10",
}

export function LoadingState({
  label = "Loading…",
  className,
  size = "md",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-slate-400",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-blue-400", sizeMap[size])} />
      <p className="text-sm">{label}</p>
    </div>
  )
}
