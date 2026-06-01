/** Design tokens — keep in sync with :root in index.css */

export const palette = {
  background: "#fafafa",
  card: "#ffffff",
  foreground: "#111111",
  mutedForeground: "#666666",
  primary: "#0070f3",
  border: "#e5e7eb",
  destructive: "#ef4444",
  success: "#22c55e",
} as const

/** Recharts cannot use Tailwind classes; use palette hex values */
export const chartColors = {
  positive: palette.success,
  neutral: palette.mutedForeground,
  negative: palette.destructive,
  grid: palette.border,
  axis: palette.mutedForeground,
} as const

export const chartTooltipStyle = {
  backgroundColor: palette.card,
  border: `1px solid ${palette.border}`,
  borderRadius: "8px",
  color: palette.foreground,
} as const

export const chartTooltipLabelStyle = { color: palette.foreground } as const
