import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Copy } from "lucide-react"
import type { PulseChatDataUsed } from "@/api/chat"
import { SuggestionsBar } from "@/components/chat/SuggestionsBar"
import { cn } from "@/lib/utils"

export type ChatMessageItem = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  dataUsed?: PulseChatDataUsed
  hasRealData?: boolean
  isError?: boolean
}

type MessageBubbleProps = {
  message: ChatMessageItem
  onSuggestionClick: (text: string) => void
}

const MARKDOWN_CLASS =
  "text-sm leading-relaxed text-gray-800 dark:text-gray-200 " +
  "[&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-white " +
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 " +
  "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 " +
  "[&_li]:my-0.5 " +
  "[&_p]:my-1.5 " +
  "[&_h1]:my-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 dark:[&_h1]:text-white " +
  "[&_h2]:my-1.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 dark:[&_h2]:text-white " +
  "[&_h3]:my-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-white " +
  "[&_a]:text-purple-600 dark:[&_a]:text-purple-400 [&_a]:hover:underline " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-purple-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 dark:[&_blockquote]:text-gray-400 " +
  "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:text-xs dark:[&_code]:bg-[#252538]"

function isDatabaseError(content: string): boolean {
  const lower = content.toLowerCase()
  return (
    lower.includes("pymysql") ||
    lower.includes("operationalerror") ||
    lower.includes("sqlalchemy") ||
    lower.includes("[sql:") ||
    lower.includes("unknown column")
  )
}

export function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const showDbError = !isUser && isDatabaseError(message.content)
  const suggestions = message.suggestions ?? []

  function copyMessage() {
    void navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn("group flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isUser
            ? "bg-purple-600 text-white"
            : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
        )}
      >
        {isUser ? "U" : "⚡"}
      </div>

      <div
        className={cn(
          "flex w-full max-w-[85%] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-purple-600 text-white"
              : message.isError
                ? "rounded-tl-md border border-red-200 bg-red-50 text-red-700"
                : "rounded-tl-md bg-gray-100 text-gray-800 dark:bg-[#252538] dark:text-gray-200"
          )}
        >
          {!isUser && message.hasRealData && (
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-purple-600">
              <span className="inline-block size-1.5 rounded-full bg-green-500" />
              Based on live data
            </div>
          )}

          {isUser ? (
            <p>{message.content}</p>
          ) : showDbError ? (
            <div>
              <p className="mb-1 font-medium text-red-600">
                Database connection issue
              </p>
              <p className="text-xs text-red-500">
                The chat history service encountered an error. Your question was
                received but history could not be saved. Please try again.
              </p>
            </div>
          ) : (
            <div className={MARKDOWN_CLASS}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <div className="mt-1.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={copyMessage}
              className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <Copy size={11} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {!isUser && suggestions.length > 0 && (
          <SuggestionsBar
            suggestions={suggestions}
            onSuggestionClick={onSuggestionClick}
          />
        )}

        <span className="mt-1 text-[10px] text-gray-400">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}
