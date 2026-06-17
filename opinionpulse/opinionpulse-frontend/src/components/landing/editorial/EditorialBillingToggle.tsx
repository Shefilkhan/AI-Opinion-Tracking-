import { cn } from "@/lib/utils"

type EditorialBillingToggleProps = {
  isAnnual: boolean
  onChange: (annual: boolean) => void
}

export function EditorialBillingToggle({ isAnnual, onChange }: EditorialBillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--le-border)] bg-[var(--le-sage-soft)] p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
          !isAnnual
            ? "bg-[var(--le-forest)] text-white shadow-sm"
            : "text-[var(--le-muted)] hover:text-[var(--le-text)]"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
          isAnnual
            ? "bg-[var(--le-forest)] text-white shadow-sm"
            : "text-[var(--le-muted)] hover:text-[var(--le-text)]"
        )}
      >
        Yearly
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isAnnual ? "bg-white/20 text-white" : "bg-[var(--le-sage-muted)] text-[var(--le-forest)]"
          )}
        >
          20% off
        </span>
      </button>
    </div>
  )
}
