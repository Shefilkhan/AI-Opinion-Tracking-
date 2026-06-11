import { cn } from "@/lib/utils"

type BillingToggleProps = {
  isAnnual: boolean
  onChange: (annual: boolean) => void
}

export function BillingToggle({ isAnnual, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-border bg-card p-1.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
          !isAnnual
            ? "bg-primary text-primary-foreground"
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
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Annually
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
          Save 20%
        </span>
      </button>
    </div>
  )
}
