import { useState } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { comparisonRows, type ComparisonCell } from "@/data/pricingData"
import { cn } from "@/lib/utils"

function CellValue({ value }: { value: ComparisonCell }) {
  if (value === true) {
    return <Check className="mx-auto size-5 text-green-600" aria-label="Included" />
  }
  if (value === false) {
    return <X className="mx-auto size-5 text-gray-300" aria-label="Not included" />
  }
  return <span className="text-sm text-gray-700">{value}</span>
}

export function ComparisonTable() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-20">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Compare All Features
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
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
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">
                    Starter
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-purple-700">
                    Pro
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => {
                  if (row.category) {
                    return (
                      <tr key={row.category} className="bg-purple-50/50">
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-purple-700"
                        >
                          {row.category}
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr
                      key={row.feature}
                      className={cn(i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-medium text-gray-800">
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
