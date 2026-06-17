import { Info } from "lucide-react"
import { planDisplayName } from "@/lib/planStorage"
import type { PlanId } from "@/data/pricingData"

type BetaAccessBannerProps = {
  plan: PlanId
}

export function BetaAccessBanner({ plan }: BetaAccessBannerProps) {
  const planName = planDisplayName(plan)

  return (
    <div className="flex items-start gap-3 rounded-[var(--dash-radius)] border border-[var(--dash-accent-border)] bg-[var(--dash-accent-soft)] px-4 py-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-[var(--dash-radius-sm)] bg-[var(--dash-accent)]/15 text-[var(--dash-accent)]">
        <Info className="size-3.5" strokeWidth={2.25} />
      </div>
      <p className="m-0 text-[12.5px] leading-relaxed text-[var(--dash-text-mid)]">
        <span className="font-semibold text-[var(--dash-text)]">Beta access.</span>{" "}
        Payment processing is coming soon. You have full{" "}
        <span className="font-semibold text-[var(--dash-text)]">{planName}</span> access
        during the beta period.
      </p>
    </div>
  )
}
