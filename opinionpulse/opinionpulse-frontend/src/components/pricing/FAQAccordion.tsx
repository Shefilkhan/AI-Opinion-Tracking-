import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { pricingFaqs } from "@/data/pricingData"
import { cn } from "@/lib/utils"

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20">
      <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">
        Frequently Asked Questions
      </h2>
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-2 shadow-sm">
        {pricingFaqs.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{item.q}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-gray-400 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-5 text-sm leading-relaxed text-gray-600">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
