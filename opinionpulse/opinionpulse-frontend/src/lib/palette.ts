/** Design tokens — keep in sync with :root in index.css */

export const palette = {
  background: "#f8f7ff",
  card: "#ffffff",
  foreground: "#0f172a",
  mutedForeground: "#64748b",
  primary: "#7c3aed",
  border: "#e2e8f0",
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
  primary: palette.primary,
} as const

export const chartTooltipStyle = {
  backgroundColor: palette.card,
  border: `1px solid ${palette.border}`,
  borderRadius: "10px",
  color: palette.foreground,
} as const

export const chartTooltipLabelStyle = { color: palette.foreground } as const
