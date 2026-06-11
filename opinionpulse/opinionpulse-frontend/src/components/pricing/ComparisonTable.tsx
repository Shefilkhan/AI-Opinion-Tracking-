import { useState } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { comparisonRows, type ComparisonCell } from "@/data/pricingData"
import { cn } from "@/lib/utils"

function CellValue({ value }: { value: ComparisonCell }) {
  if (value === true) {
    return <Check className="mx-auto size-5 text-success" aria-label="Included" />
  }
  if (value === false) {
    return <X className="mx-auto size-5 text-muted-foreground/40" aria-label="Not included" />
  }
  return <span className="text-sm text-foreground">{value}</span>
}

export function ComparisonTable() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-20">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h2 className="font-serif-display text-2xl font-medium tracking-normal text-foreground md:text-3xl">
          Compare All Features
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          {open ? "Hide full comparison" : "Show full comparison"}
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "mt-8 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-[var(--bg-secondary)] px-4 py-4 text-sm font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">
                    Starter
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-primary">
                    Pro
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => {
                  if (row.category) {
                    return (
                      <tr key={row.category} className="bg-primary/5">
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary"
                        >
                          {row.category}
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr
                      key={row.feature}
                      className={cn(i % 2 === 0 ? "bg-card" : "bg-[var(--bg-secondary)]/50")}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CellValue value={row.starter} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CellValue value={row.pro} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CellValue value={row.enterprise} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
