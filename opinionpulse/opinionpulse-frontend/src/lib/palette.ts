/** Design tokens — keep in sync with :root in index.css (editorial / landing palette) */

export const palette = {
  background: "#fafaf8",
  card: "#ffffff",
  foreground: "#1a1f1a",
  mutedForeground: "#8a9288",
  primary: "#2f3a2f",
  border: "#e5e7e2",
  destructive: "#a85454",
  success: "#3d6b4f",
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
  borderRadius: "12px",
  color: palette.foreground,
} as const

export const chartTooltipLabelStyle = { color: palette.foreground } as const
