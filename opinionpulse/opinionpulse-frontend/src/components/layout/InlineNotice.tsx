import type { LucideIcon } from "lucide-react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type InlineNoticeVariant = "info" | "warning" | "success"

type InlineNoticeProps = {
  variant?: InlineNoticeVariant
  title?: string
  children: React.ReactNode
  className?: string
  icon?: LucideIcon
}

const variantStyles: Record<InlineNoticeVariant, string> = {
  info: "border-border bg-muted/40 text-foreground",
  warning: "border-primary/20 bg-accent/50 text-foreground",
  success: "border-success/20 bg-success/5 text-foreground",
}

const defaultIcons: Record<InlineNoticeVariant, LucideIcon> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle2,
}

export function InlineNotice({
  variant = "info",
  title,
  children,
  className,
  icon,
}: InlineNoticeProps) {
  const Icon = icon ?? defaultIcons[variant]

  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-sm leading-relaxed",
        variantStyles[variant],
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="mb-0.5 font-medium text-foreground">{title}</p>}
        <div className="text-muted-foreground [&_strong]:text-foreground [&_code]:rounded [&_code]:bg-muted/60 [&_code]:px-1 [&_code]:text-xs">
          {children}
        </div>
      </div>
    </div>
  )
}
