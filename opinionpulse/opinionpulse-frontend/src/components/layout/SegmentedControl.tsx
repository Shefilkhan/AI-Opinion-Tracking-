import { cn } from "@/lib/utils"

export type SegmentedOption<T extends string = string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string = string> = {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  "aria-label"?: string
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-muted/30 p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-card text-foreground shadow-none ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
