import { liveStats } from "@/data/landingData"
import { useCountAnimation } from "@/hooks/useCountAnimation"

function StatItem({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  const [count, ref] = useCountAnimation(value)

  return (
    <div ref={ref} className="flex flex-1 flex-col items-center px-4 py-8 text-center">
      <div className="text-3xl font-bold text-white md:text-4xl">
        {count}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-gray-400">{label}</div>
    </div>
  )
}

export function LiveStatsBar() {
  return (
    <section
      className="relative border-y border-white/[0.08] bg-white/[0.03]"
      aria-label="Platform statistics"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap px-6 md:flex-nowrap">
        {liveStats.map((stat, i) => (
          <div key={stat.label} className="flex w-1/2 flex-1 items-stretch md:w-auto">
            <StatItem value={stat.value} suffix={stat.suffix} label={stat.label} />
            {i < liveStats.length - 1 && (
              <div className="hidden w-px self-stretch bg-white/10 md:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
