import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Zap } from "lucide-react"
import type { ChatMessageItem } from "@/components/chat/types"
import { CitedTextRenderer } from "@/components/chat/CitedTextRenderer"
import { CitedSourcesList } from "@/components/chat/CitedSourcesList"
import { SuggestionChips } from "@/components/chat/SuggestionChips"
import { DiscussionThemesCard } from "@/components/chat/cards/DiscussionThemesCard"
import { SentimentSnapshotCard } from "@/components/chat/cards/SentimentSnapshotCard"
import { ThemesTableCard } from "@/components/chat/cards/ThemesTableCard"
import { ResearchBriefRenderer } from "@/components/chat/ResearchBriefRenderer"
import {
  formatTimeAgo,
  getDisplayTextContent,
  isDatabaseError,
  isResearchBrief,
  parseDiscussionThemes,
  parseSentimentSnapshot,
  parseThemesTable,
} from "@/lib/chat-message-utils"

type AIMessageProps = {
  message: ChatMessageItem
  onSuggestionClick: (text: string) => void
  onCitationClick?: (refId: number) => void
}

export function AIMessage({ message, onSuggestionClick, onCitationClick }: AIMessageProps) {
  const sourcesCount = message.sourcesFetched ?? message.dataUsed?.results_count ?? 0
  const discussionThemes = parseDiscussionThemes(message)
  const sentimentSnapshot = parseSentimentSnapshot(message)
  const themesTable = parseThemesTable(message)
  const textContent = getDisplayTextContent(message)
  const citedSources = message.citedSources ?? []
  const showDbError = isDatabaseError(message.content)

  if (isResearchBrief(message) && message.structured) {
    return (
      <div className="flex items-start gap-3">
        <div className="chat-ai-avatar flex size-8 shrink-0 items-center justify-center rounded-[10px]">
          <Zap size={14} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <MessageHeader
            sourcesCount={sourcesCount}
            timestamp={message.timestamp}
          />
          <div className="chat-markdown mb-3">
            <ResearchBriefRenderer
              structured={message.structured}
              references={message.references}
              onCitationClick={onCitationClick}
              dark
            />
          </div>
          {message.suggestions?.length ? (
            <SuggestionChips
              suggestions={message.suggestions}
              onSelect={onSuggestionClick}
            />
          ) : null}
        </div>
      </div>
    )
  }

  if (message.isError || showDbError) {
    return (
      <div className="flex items-start gap-3">
        <div className="chat-ai-avatar flex size-8 shrink-0 items-center justify-center rounded-[10px]">
          <Zap size={14} className="text-white" />
        </div>
        <div className="chat-card flex-1 border-red-500/30 p-4">
          <p className="mb-1 font-medium text-[var(--chat-red)]">
            {message.isError ? "Something went wrong" : "Database connection issue"}
          </p>
          <p className="text-sm text-[var(--chat-text-mid)]">
            {showDbError
              ? "The chat history service encountered an error. Please try again."
              : message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="chat-ai-avatar flex size-8 shrink-0 items-center justify-center rounded-[10px]">
        <Zap size={14} className="text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <MessageHeader sourcesCount={sourcesCount} timestamp={message.timestamp} />

        {textContent && (
          <div className="chat-markdown mb-4 text-[14.5px] leading-[1.7] text-[var(--chat-text)]">
            {citedSources.length > 0 ? (
              <CitedTextRenderer content={textContent} citedSources={citedSources} />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
            )}
          </div>
        )}

        {discussionThemes && discussionThemes.length > 0 && (
          <DiscussionThemesCard themes={discussionThemes} />
        )}

        {sentimentSnapshot && <SentimentSnapshotCard data={sentimentSnapshot} />}

        {themesTable && themesTable.length > 0 && (
          <ThemesTableCard rows={themesTable} />
        )}

        {citedSources.length > 0 && <CitedSourcesList sources={citedSources} />}

        {message.suggestions && message.suggestions.length > 0 && (
          <SuggestionChips
            suggestions={message.suggestions}
            onSelect={onSuggestionClick}
          />
        )}
      </div>
    </div>
  )
}

function MessageHeader({
  sourcesCount,
  timestamp,
}: {
  sourcesCount: number
  timestamp: Date
}) {
  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-[var(--chat-purple)]">Pulse AI</span>
      {sourcesCount > 0 && (
        <span className="chat-mono text-[10px] tracking-wider text-[var(--chat-text-muted)]">
          · {sourcesCount} SOURCES ANALYZED
        </span>
      )}
      <span className="chat-mono text-[10px] text-[var(--chat-text-muted)]">
        · {formatTimeAgo(timestamp)}
      </span>
    </div>
  )
}
