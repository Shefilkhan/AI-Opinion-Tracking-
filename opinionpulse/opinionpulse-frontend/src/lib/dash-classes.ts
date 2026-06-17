/** Dashboard UI tokens — always use var(--dash-*) for theme-aware styling */

export const dashCard =
  "rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]"

export const dashCardStatic =
  "rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]"

export const dashSectionTitle =
  "text-[15px] font-semibold tracking-[-0.01em] text-[var(--dash-text)]"

export const dashSectionDesc =
  "mt-0.5 text-[12px] text-[var(--dash-text-mid)]"

export const dashSectionGap = "mt-[var(--space-8)] first:mt-0"

export const dashSentimentBadge = {
  positive:
    "bg-[var(--dash-pos-soft)] text-[var(--dash-pos)]",
  negative:
    "bg-[var(--dash-neg-soft)] text-[var(--dash-neg)]",
  mixed: "bg-[var(--dash-neu-soft)] text-[var(--dash-neu)]",
  neutral: "bg-[var(--dash-neu-soft)] text-[var(--dash-neu)]",
} as const
