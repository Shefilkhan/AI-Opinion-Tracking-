/** Design tokens — keep in sync with :root in index.css */

export const palette = {
  background: "#faf9f7",
  card: "#ffffff",
  foreground: "#1c1917",
  mutedForeground: "#78716c",
  primary: "#c96442",
  border: "#e8e6e1",
  destructive: "#dc2626",
  success: "#16a34a",
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
