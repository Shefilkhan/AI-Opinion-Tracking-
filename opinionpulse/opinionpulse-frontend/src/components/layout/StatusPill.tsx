import { cn } from "@/lib/utils"

type StatusPillProps = {
  label: string
  live?: boolean
  variant?: "live" | "off" | "neutral"
}

export function StatusPill({ label, live, variant }: StatusPillProps) {
  const resolved = variant ?? (live ? "live" : "off")

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        resolved === "live" &&
          "border-success/30 bg-success/5 text-success",
        resolved === "off" &&
          "border-border bg-muted/40 text-muted-foreground",
        resolved === "neutral" &&
          "border-border bg-card text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          resolved === "live" && "bg-success",
          resolved === "off" && "bg-muted-foreground/40",
          resolved === "neutral" && "bg-primary"
        )}
        aria-hidden
      />
      {label}
    </span>
  )
}
