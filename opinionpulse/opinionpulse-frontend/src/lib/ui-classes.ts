/** Shared Tailwind classes — Vercel / Linear minimal system */

export const pageShell = "min-h-screen bg-background text-foreground"

export const cardSurface =
  "rounded-lg border border-gray-200 bg-card text-card-foreground shadow-[var(--shadow-subtle)]"

export const cardInteractive =
  "rounded-lg border border-gray-200 bg-card text-card-foreground shadow-[var(--shadow-subtle)] transition-colors duration-150 hover:border-gray-300 hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]"

export const panelSurface =
  "rounded-lg border border-gray-200 bg-card shadow-[var(--shadow-subtle)]"

export const btnPrimary =
  "bg-primary text-primary-foreground rounded-md shadow-none hover:bg-primary/90 transition-colors duration-150"

export const inputSurface =
  "h-9 rounded-lg border border-gray-200 bg-card text-foreground text-sm placeholder:text-muted-foreground transition-colors duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"

export const selectSurface =
  "h-9 rounded-lg border border-gray-200 bg-card px-3 text-sm text-foreground transition-colors duration-150 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"

/** Page h1 (layout header) */
export const pageTitle = "text-xl font-semibold tracking-tight text-foreground md:text-2xl"

export const pageSubtitle = "text-sm font-normal text-muted-foreground"

/** Section h2 inside page content */
export const sectionTitle = "text-lg font-semibold tracking-tight text-foreground"

/** Card / panel h3 */
export const cardTitle = "text-base font-semibold tracking-tight text-foreground"

export const labelText = "text-sm font-medium text-foreground"

export const bodyText = "text-sm font-normal text-foreground"

export const mutedText = "text-sm font-normal text-muted-foreground"

export const errorSurface =
  "rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"

export const successSurface =
  "rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success"

/** Neutral section wrapper (no tinted backgrounds) */
export const sectionShell = "border-y border-gray-200 py-16 md:py-24"

/** @deprecated Use pageShell */
export const pageMesh = pageShell

export { chartColors, chartTooltipStyle, chartTooltipLabelStyle } from "@/lib/palette"
