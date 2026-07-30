import type { ThemeTableRow } from "@/components/chat/types"

type ThemesTableCardProps = {
  rows: ThemeTableRow[]
}

export function ThemesTableCard({ rows }: ThemesTableCardProps) {
  if (!rows.length) return null

  return (
    <div className="chat-card mb-3 overflow-hidden">
      <div className="grid grid-cols-[1fr_80px_1fr] border-b border-[var(--chat-border)] bg-[var(--chat-surface-2)] px-[18px] py-2.5">
        {["THEME", "SHARE", "DETAIL"].map((col) => (
          <span
            key={col}
            className={`chat-mono text-[10px] font-bold tracking-widest text-[var(--chat-text-muted)] ${
              col === "SHARE" ? "text-center" : "text-left"
            }`}
          >
            {col}
          </span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={`${row.theme}-${i}`}
          className="chat-table-row grid grid-cols-[1fr_80px_1fr] px-[18px] py-3 transition-colors"
          style={{
            borderBottom: i < rows.length - 1 ? "1px solid var(--chat-border-2)" : "none",
          }}
        >
          <span className="text-[13.5px] font-semibold text-[var(--chat-text)]">{row.theme}</span>
          <span className="chat-mono text-center text-[13px] font-bold text-[var(--chat-purple)]">
            {row.share}%
          </span>
          <span className="text-[13px] text-[var(--chat-text-mid)]">{row.detail}</span>
        </div>
      ))}
    </div>
  )
}
