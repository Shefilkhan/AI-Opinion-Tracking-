import { cn } from "@/lib/utils"

type BillingToggleProps = {
  isAnnual: boolean
  onChange: (annual: boolean) => void
}

export function BillingToggle({ isAnnual, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
          !isAnnual
            ? "bg-card text-foreground shadow-sm dark:bg-white/10"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
          isAnnual
            ? "btn-gradient py-2 shadow-md"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Annually
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isAnnual
              ? "bg-white/20 text-white"
              : "bg-success/10 text-success"
          )}
        >
          Save 20%
        </span>
      </button>
    </div>
  )
}
