import { cn } from "@/lib/utils"

type BillingToggleProps = {
  isAnnual: boolean
  onChange: (annual: boolean) => void
}

export function BillingToggle({ isAnnual, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-gray-200 bg-white p-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
          !isAnnual
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900"
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
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        Annually
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          Save 20%
        </span>
      </button>
    </div>
  )
}
