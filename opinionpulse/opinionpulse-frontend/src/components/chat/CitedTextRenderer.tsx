import type { PulseChatCitedSource } from "@/api/chat"

type CitedTextRendererProps = {
  content: string
  citedSources?: PulseChatCitedSource[]
}

export function CitedTextRenderer({ content, citedSources = [] }: CitedTextRendererProps) {
  if (!citedSources.length) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }

  const parts = content.split(/(\[\d+\])/g)
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (!match) return <span key={`t-${index}`}>{part}</span>

        const num = parseInt(match[1], 10)
        const source = citedSources.find((s) => s.number === num)
        if (!source?.url) return <span key={`c-${index}`}>{part}</span>

        return (
          <a
            key={`c-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.title}
            className="mx-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-[var(--chat-purple-dim)] px-1.5 py-0.5 align-baseline text-[10px] font-bold text-[var(--chat-purple)] no-underline hover:bg-[rgba(139,92,246,0.25)]"
          >
            {num}
          </a>
        )
      })}
    </span>
  )
}
