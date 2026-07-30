import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Check } from "lucide-react"
import type { PulseChatReference, PulseChatStructured } from "@/api/chat"
import { ResearchBriefRenderer } from "@/components/chat/ResearchBriefRenderer"
import { cn } from "@/lib/utils"

const MARKDOWN_CLASS =
  "text-sm leading-relaxed text-foreground " +
  "[&_strong]:font-medium [&_strong]:text-foreground " +
  "[&_ul]:my-2 [&_ul]:list-none [&_ul]:space-y-1.5 [&_ul]:pl-0 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 " +
  "[&_li]:my-0.5 " +
  "[&_p]:my-2 " +
  "[&_h1]:my-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-foreground " +
  "[&_h2]:my-2.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground " +
  "[&_h3]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground " +
  "[&_a]:text-primary [&_a]:hover:underline " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-border " +
  "[&_thead]:bg-muted/60 " +
  "[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground " +
  "[&_td]:border-b [&_td]:border-border/70 [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-sm " +
  "[&_tr:last-child_td]:border-b-0"

const DARK_MARKDOWN_CLASS =
  "text-sm leading-relaxed text-[#e8e8e8] " +
  "[&_strong]:font-medium [&_strong]:text-white " +
  "[&_ul]:my-2 [&_ul]:list-none [&_ul]:space-y-1.5 [&_ul]:pl-0 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:text-[#e8e8e8] " +
  "[&_li]:my-0.5 [&_li]:text-[#e8e8e8] " +
  "[&_p]:my-2 [&_p]:text-[#e8e8e8] " +
  "[&_h1]:my-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-white " +
  "[&_h2]:my-2.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white " +
  "[&_h3]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white " +
  "[&_a]:text-[#7eb8ff] [&_a]:hover:underline " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-[#444] [&_blockquote]:pl-3 [&_blockquote]:text-[#b0b0b0] " +
  "[&_code]:rounded [&_code]:bg-[#2a2a2a] [&_code]:px-1 [&_code]:text-xs [&_code]:text-[#e8e8e8] " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-[#333] " +
  "[&_thead]:bg-[#1a1a1a] " +
  "[&_th]:border-b [&_th]:border-[#333] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[#999] " +
  "[&_td]:border-b [&_td]:border-[#333] [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-sm [&_td]:text-[#ddd] " +
  "[&_tr:last-child_td]:border-b-0"

type StructuredChatRendererProps = {
  content: string
  structured?: PulseChatStructured | null
  references?: PulseChatReference[]
  onCitationClick?: (refId: number) => void
  showInlineReferences?: boolean
  dark?: boolean
}

function ThemeBreakdown({
  items,
  dark = false,
}: {
  items: { label: string; pct: number; detail?: string }[]
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        "mb-4 space-y-2 rounded-xl border p-3",
        dark ? "border-[#333] bg-[#161616]" : "border-border bg-muted/30"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          dark ? "text-[#999]" : "text-muted-foreground"
        )}
      >
        Discussion themes
      </p>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className={cn("font-medium", dark ? "text-white" : "text-foreground")}>
              {item.label}
            </span>
            <span className={cn("tabular-nums", dark ? "text-[#aaa]" : "text-muted-foreground")}>
              {item.pct}%
            </span>
          </div>
          <div className={cn("h-2 overflow-hidden rounded-full", dark ? "bg-[#2a2a2a]" : "bg-muted")}>
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }}
            />
          </div>
          {item.detail && (
            <p
              className={cn(
                "mt-1 text-[11px] leading-snug",
                dark ? "text-[#aaa]" : "text-muted-foreground"
              )}
            >
              {item.detail}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function ComparisonChart({
  aLabel,
  bLabel,
  dimensions,
  leaders,
}: {
  aLabel: string
  bLabel: string
  dimensions: { name: string; a: number; b: number }[]
  leaders?: { a?: string[]; b?: string[] }
}) {
  const chartData = dimensions.map((d) => ({
    name: d.name,
    [aLabel]: d.a,
    [bLabel]: d.b,
  }))

  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/20 p-3">
      <p className="mb-1 text-sm font-semibold text-foreground">
        {aLabel} vs {bLabel}
      </p>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Qualitative comparison (1 = weaker · 5 = stronger). Scores are illustrative.
      </p>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.4} />
            <XAxis type="number" domain={[0, 6]} tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey={aLabel} fill="#2f3a2f" radius={[0, 4, 4, 0]} barSize={10} />
            <Bar dataKey={bLabel} fill="#16a34a" radius={[0, 4, 4, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {leaders && (leaders.a?.length || leaders.b?.length) ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {leaders.a?.length ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-foreground">{aLabel} leads in</p>
              <ul className="space-y-1">
                {leaders.a.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {leaders.b?.length ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-foreground">{bLabel} leads in</p>
              <ul className="space-y-1">
                {leaders.b.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function markdownComponents(dark = false) {
  return {
    h3: ({ children }: { children?: ReactNode }) => {
      const text = String(children ?? "")
      const isPros = /pros of/i.test(text)
      const isCons = /cons of/i.test(text)
      return (
        <h3
          className={cn(
            "rounded-lg px-2.5 py-1.5",
            isPros && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
            isCons && "bg-red-500/10 text-red-800 dark:text-red-300",
            !isPros && !isCons && (dark ? "text-white" : "text-foreground")
          )}
        >
          {children}
        </h3>
      )
    },
    li: ({ children }: { children?: ReactNode }) => (
      <li className={cn("flex gap-2 text-sm", dark ? "text-[#e8e8e8]" : "")}>
        <span
          className={cn(
            "mt-2 size-1.5 shrink-0 rounded-full",
            dark ? "bg-[#7eb8ff]" : "bg-primary/70"
          )}
        />
        <span className="min-w-0 flex-1">{children}</span>
      </li>
    ),
  }
}

export function StructuredChatRenderer({
  content,
  structured,
  references = [],
  onCitationClick,
  showInlineReferences = false,
  dark = false,
}: StructuredChatRendererProps) {
  const showResearch = structured?.type === "research_brief"
  const showThemeFirst = structured?.type === "theme_breakdown"
  const showComparisonAfter = structured?.type === "comparison_chart"

  if (showResearch && structured) {
    return (
      <ResearchBriefRenderer
        structured={structured}
        references={references}
        onCitationClick={onCitationClick}
        showInlineReferences={showInlineReferences}
        dark={dark}
      />
    )
  }

  return (
    <div>
      {showThemeFirst && structured.items?.length ? (
        <ThemeBreakdown items={structured.items} dark={dark} />
      ) : null}

      <div className={dark ? DARK_MARKDOWN_CLASS : MARKDOWN_CLASS}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(dark)}>
          {content}
        </ReactMarkdown>
      </div>

      {showComparisonAfter &&
      structured.dimensions?.length &&
      structured.a_label &&
      structured.b_label ? (
        <ComparisonChart
          aLabel={structured.a_label}
          bLabel={structured.b_label}
          dimensions={structured.dimensions}
          leaders={structured.leaders}
        />
      ) : null}
    </div>
  )
}
