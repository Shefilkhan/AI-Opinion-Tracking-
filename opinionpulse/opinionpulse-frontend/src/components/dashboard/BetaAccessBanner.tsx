import { Sparkles } from "lucide-react"
import { planDisplayName } from "@/lib/planStorage"
import type { PlanId } from "@/data/pricingData"

type BetaAccessBannerProps = {
  plan: PlanId
}

export function BetaAccessBanner({ plan }: BetaAccessBannerProps) {
  const planName = planDisplayName(plan)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--dash-accent-border)] bg-[var(--dash-accent-soft)] px-[18px] py-3.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--dash-accent)]">
        <Sparkles className="size-3.5 text-white" strokeWidth={2} />
      </div>
      <p className="m-0 text-[13px] text-[var(--dash-text)]">
        <strong className="font-semibold">Beta access</strong>
        <span className="text-[var(--dash-text-mid)]">
          {" "}
          — Payment processing coming soon. You have full{" "}
        </span>
        <strong className="font-semibold text-[var(--dash-accent)]">
          {planName}
        </strong>
        <span className="text-[var(--dash-text-mid)]"> access during our beta.</span>
      </p>
    </div>
  )
}
