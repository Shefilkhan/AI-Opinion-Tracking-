import { BarChart3 } from "lucide-react"
import type { DiscussionTheme } from "@/components/chat/types"

const BAR_COLORS = ["#8B5CF6", "#60A5FA", "#34D399", "#FBBF24", "#F87171"]

type DiscussionThemesCardProps = {
  themes: DiscussionTheme[]
}

export function DiscussionThemesCard({ themes }: DiscussionThemesCardProps) {
  if (!themes.length) return null

  return (
    <div className="chat-card mb-3 overflow-hidden">
      <div className="chat-card-header">
        <BarChart3 size={14} className="text-[var(--chat-purple)]" />
        <span className="chat-card-label">Discussion Themes</span>
      </div>
      <div className="flex flex-col gap-3.5 p-[18px]">
        {themes.map((theme, i) => {
          const color = BAR_COLORS[i % BAR_COLORS.length]
          return (
            <div key={theme.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--chat-text)]">{theme.label}</span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color }}
                >
                  {theme.percentage}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-white/[0.06]">
                <div
                  className="h-full rounded transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, theme.percentage))}%`,
                    background: color,
                    boxShadow: `0 0 8px ${color}60`,
                  }}
                />
              </div>
              {theme.detail && (
                <p className="mt-1 text-[11px] text-[var(--chat-text-muted)]">{theme.detail}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
