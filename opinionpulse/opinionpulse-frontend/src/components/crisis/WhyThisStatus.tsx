import { Check } from "lucide-react"
import type { RadarPoint } from "@/api/crisis"
import { buildWhyThisStatus } from "@/lib/crisis-display"
import { proCard } from "@/lib/ui-classes"

type WhyThisStatusProps = {
  point: RadarPoint
}

export function WhyThisStatus({ point }: WhyThisStatusProps) {
  const { checks, conclusion } = buildWhyThisStatus(point)

  return (
    <section className={`${proCard} p-5 sm:p-6`}>
      <h3 className="crisis-section-label m-0">Why this status?</h3>
      <ul className="mt-4 space-y-3">
        {checks.map((check) => (
          <li key={check.title} className="flex gap-2.5">
            <span
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]"
              aria-hidden
            >
              <Check className="size-3" />
            </span>
            <div>
              <p className="m-0 text-sm text-[var(--dash-text)]">{check.title}</p>
              <p className="mt-0.5 mb-0 text-xs text-[var(--dash-text-faint)]">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3">
        <p className="crisis-mini-label mb-1">Conclusion</p>
        <p className="m-0 text-sm leading-relaxed text-[var(--dash-text-mid)]">{conclusion}</p>
      </div>
    </section>
  )
}
