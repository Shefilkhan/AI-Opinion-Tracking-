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
  "rounded-[var(--radius-lg)] border border-border/50 bg-card backdrop-blur-xl shadow-sm transition-all duration-300"

export const cardSurface =
  "rounded-[var(--radius-lg)] border border-border/50 bg-card backdrop-blur-xl text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"

export const cardInteractive =
  "rounded-[var(--radius-lg)] border border-border/50 bg-card backdrop-blur-xl text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 cursor-pointer"

export const panelSurface =
  "rounded-[var(--radius-lg)] border border-border/50 bg-card backdrop-blur-xl shadow-sm transition-all duration-300"

export const surfaceCard =
  "rounded-[var(--radius-lg)] border border-border/50 bg-card backdrop-blur-xl shadow-sm transition-all duration-300"

export const surfaceInput =
  "rounded-[var(--radius-xl)] border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 focus:bg-background"

export const sidebarSurface =
  "bg-[var(--bg-sidebar)] border-border transition-colors duration-200"

export const btnPrimary =
  "bg-primary text-primary-foreground rounded-[var(--radius-xl)] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium"

export const inputSurface =
  "h-11 px-4 rounded-[var(--radius-xl)] border border-border bg-card/80 backdrop-blur-sm text-foreground text-sm placeholder:text-muted-foreground transition-all duration-200 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:bg-background hover:border-primary/30"

export const selectSurface =
  "h-11 rounded-[var(--radius-xl)] border border-border bg-card/80 backdrop-blur-sm px-4 text-sm text-foreground transition-all duration-200 outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 hover:border-primary/30"

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

/** Centered main column for app pages */
export const contentMaxWidth = "mx-auto w-full max-w-7xl"

/** Stat / metric typography */
export const statValue =
  "text-[26px] font-medium tabular-nums leading-none tracking-tight text-foreground md:text-[28px]"

export const statLabel = "text-[13px] font-normal text-muted-foreground"

export const sectionDescription = "text-sm font-normal leading-relaxed text-muted-foreground"

/** Table styling */
export const tableHeader =
  "border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"

export const tableRow =
  "border-b border-border transition-colors duration-150 hover:bg-muted/30"

export { chartColors, chartTooltipLabelStyle, chartTooltipStyle } from "@/lib/palette"
