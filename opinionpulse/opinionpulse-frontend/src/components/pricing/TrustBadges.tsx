import { trustBadges } from "@/data/pricingData"

export function TrustBadges() {
  return (
    <section className="border-t border-gray-100 py-12">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 md:gap-0">
        {trustBadges.map((badge, i) => (
          <div key={badge.label} className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-purple-100 text-lg">
                {badge.emoji}
              </span>
              <span className="text-sm text-gray-600">{badge.label}</span>
            </div>
            {i < trustBadges.length - 1 && (
              <div className="hidden h-8 w-px bg-gray-200 md:block" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
