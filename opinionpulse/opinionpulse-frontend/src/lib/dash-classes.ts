/** Dashboard UI tokens — always use var(--dash-*) for theme-aware styling */

export const dashCard =
  "rounded-[14px] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)] transition-[box-shadow,border-color] duration-200 hover:border-[var(--dash-border-hover)] hover:shadow-[var(--dash-shadow-hover)]"

export const dashCardStatic =
  "rounded-[14px] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]"

export const dashSectionTitle =
  "text-[17px] font-semibold tracking-normal text-[var(--dash-text)]"

export const dashSectionDesc =
  "mt-0.5 text-[13px] text-[var(--dash-text-mid)]"

export const dashSectionGap = "mt-[var(--space-8)] first:mt-0"

export const dashSentimentBadge = {
  positive:
    "bg-[var(--dash-pos-soft)] text-[var(--dash-pos)]",
  negative:
    "bg-[var(--dash-neg-soft)] text-[var(--dash-neg)]",
  mixed: "bg-[var(--dash-neu-soft)] text-[var(--dash-neu)]",
  neutral: "bg-[var(--dash-neu-soft)] text-[var(--dash-neu)]",
} as const
