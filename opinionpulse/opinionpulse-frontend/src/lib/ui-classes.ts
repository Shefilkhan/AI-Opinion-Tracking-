/** Shared Tailwind classes — Vercel / Linear minimal system */

export const pageShell = "min-h-screen bg-background text-foreground transition-colors duration-200"

/** Lavender gradient shell for pages with particle background */
export const pageShellParticles =
  "min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50 text-foreground transition-colors duration-200 dark:from-[#0f0f1a] dark:via-[#1a1a2e]/80 dark:to-[#16213e]/60"

export const cardSurface =
  "rounded-lg border border-gray-200 dark:border-[#2d2d44] bg-card text-card-foreground shadow-[var(--shadow-subtle)] transition-colors duration-200"

export const cardInteractive =
  "rounded-lg border border-gray-200 dark:border-[#2d2d44] bg-card text-card-foreground shadow-[var(--shadow-subtle)] transition-colors duration-200 hover:border-gray-300 dark:hover:border-[#3d3d5c] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] dark:hover:shadow-black/30"

export const panelSurface =
  "rounded-lg border border-gray-200 dark:border-[#2d2d44] bg-card shadow-[var(--shadow-subtle)] transition-colors duration-200"

export const surfaceCard =
  "rounded-2xl border border-gray-200 dark:border-[#2d2d44] bg-white dark:bg-[#1e1e30] shadow-sm transition-colors duration-200"

export const surfaceInput =
  "border border-gray-200 dark:border-[#2d2d44] bg-gray-50 dark:bg-[#252538] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"

export const sidebarSurface =
  "bg-white/95 dark:bg-[#13131f]/95 border-gray-200 dark:border-[#2d2d44] transition-colors duration-200"

export const btnPrimary =
  "bg-primary text-primary-foreground rounded-md shadow-none hover:bg-primary/90 transition-colors duration-150"

export const inputSurface =
  "h-9 rounded-lg border border-gray-200 dark:border-[#2d2d44] bg-card text-foreground text-sm placeholder:text-muted-foreground transition-colors duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"

export const selectSurface =
  "h-9 rounded-lg border border-gray-200 dark:border-[#2d2d44] bg-card px-3 text-sm text-foreground transition-colors duration-150 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"

/** Page h1 (layout header) */
export const pageTitle = "text-xl font-semibold tracking-tight text-foreground md:text-2xl"

export const pageSubtitle = "text-sm font-normal text-muted-foreground"

/** Section h2 inside page content */
export const sectionTitle = "text-lg font-semibold tracking-tight text-foreground"

/** Card / panel h3 */
export const cardTitle = "text-base font-semibold tracking-tight text-foreground"

export const labelText = "text-sm font-medium text-foreground dark:text-gray-300"

export const bodyText = "text-sm font-normal text-foreground"

export const mutedText = "text-sm font-normal text-muted-foreground"

export const errorSurface =
  "rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"

export const successSurface =
  "rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success"

/** Neutral section wrapper (no tinted backgrounds) */
export const sectionShell =
  "border-y border-gray-200 dark:border-[#2d2d44] py-16 md:py-24"

/** @deprecated Use pageShell */
export const pageMesh = pageShell

export { chartColors, chartTooltipStyle, chartTooltipLabelStyle } from "@/lib/palette"
