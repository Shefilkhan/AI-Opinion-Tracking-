type TooltipRow = {
  name: string
  value: number
  color?: string
  description?: string
}

type DashChartTooltipProps = {
  active?: boolean
  title?: string
  rows?: TooltipRow[]
  subtitle?: string
}

export function DashChartTooltip({
  active,
  title,
  rows,
  subtitle,
}: DashChartTooltipProps) {
  if (!active || !rows?.length) return null

  return (
    <div className="pointer-events-none z-50 max-w-[220px] rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2.5 text-xs shadow-lg">
      {title ? (
        <p className="mb-2 font-semibold leading-snug text-[var(--dash-text)]">{title}</p>
      ) : null}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="leading-relaxed">
            <p className="font-medium leading-snug" style={{ color: row.color ?? "var(--dash-text)" }}>
              {row.name}: {row.value}%
            </p>
            {row.description ? (
              <p className="mt-1 leading-relaxed text-[var(--dash-text-faint)]">{row.description}</p>
            ) : null}
          </div>
        ))}
      </div>
      {subtitle ? (
        <p className="mt-2 border-t border-[var(--dash-border)] pt-2 leading-relaxed text-[var(--dash-text-faint)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
