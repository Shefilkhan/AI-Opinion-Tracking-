/** Shared Tailwind classes — Claude-inspired warm neutral system */

export const pageShell =
  "min-h-screen bg-background text-foreground transition-colors duration-200"

/** Full-width content area padding used inside DashboardLayout */
export const pageContent =
  "w-full px-5 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12 2xl:px-14"

/** Alias — no particle gradient on product pages */
export const pageShellParticles = pageShell

/** Professional card used across dashboard/search pages */
export const proCard =
  "rounded-[var(--radius-lg)] border border-border bg-card shadow-none"

export const cardSurface =
  "rounded-[var(--radius-lg)] border border-border bg-card text-card-foreground shadow-none transition-colors duration-200"

export const cardInteractive =
  "rounded-[var(--radius-lg)] border border-border bg-card text-card-foreground shadow-none transition-colors duration-200 hover:border-muted-foreground/30"

export const panelSurface =
  "rounded-[var(--radius-lg)] border border-border bg-card shadow-none transition-colors duration-200"

export const surfaceCard =
  "rounded-[var(--radius-lg)] border border-border bg-card shadow-none transition-colors duration-200"

export const surfaceInput =
  "border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

export const sidebarSurface =
  "bg-[var(--bg-sidebar)] border-border transition-colors duration-200"

export const btnPrimary =
  "bg-primary text-primary-foreground rounded-[var(--radius-md)] shadow-none hover:bg-primary/90 transition-colors duration-150"

export const inputSurface =
  "h-10 rounded-[var(--radius-md)] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground transition-colors duration-150 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"

export const selectSurface =
  "h-10 rounded-[var(--radius-md)] border border-border bg-card px-3 text-sm text-foreground transition-colors duration-150 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"

/** Page h1 (layout header) */
export const pageTitle =
  "font-serif-display text-xl font-medium tracking-normal text-foreground md:text-2xl"

export const pageSubtitle = "text-sm font-normal text-muted-foreground"

/** Section h2 inside page content */
export const sectionTitle =
  "font-serif-display text-lg font-medium tracking-normal text-foreground"

/** Card / panel h3 */
export const cardTitle = "text-base font-medium tracking-normal text-foreground"

export const labelText = "text-sm font-medium text-foreground"

export const bodyText = "text-sm font-normal text-foreground leading-relaxed"

export const mutedText = "text-sm font-normal text-muted-foreground"

export const successSurface =
  "rounded-[var(--radius-md)] border border-success/20 bg-success/5 px-3 py-2 text-sm text-success"

export const navItemActive =
  "bg-accent text-accent-foreground border-l-2 border-primary pl-[10px]"

export const navItemInactive =
  "text-muted-foreground hover:bg-muted/60 hover:text-foreground border-l-2 border-transparent pl-[10px]"

export { chartColors, chartTooltipLabelStyle, chartTooltipStyle } from "@/lib/palette"
