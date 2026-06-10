import { useEffect, useState } from "react"
import { Activity, X } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { useAuth } from "@/contexts/AuthContext"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function ChatBubble() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setHasNewMessage(true)
    }, 30000)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setShowTooltip(false)
  }, [isOpen])

  if (loading || !isAuthenticated || location.pathname === "/chat") {
    return null
  }

  return (
    <>
      {isOpen && (
        <div
          className={cn(
            "chat-slide-up fixed bottom-24 right-6 z-50 flex h-[520px] w-96 flex-col overflow-hidden",
            cardSurface
          )}
        >
          <ChatWindow
            mode="bubble"
            onClose={() => setIsOpen(false)}
            onExpand={() => {
              setIsOpen(false)
              navigate("/chat")
            }}
          />
        </div>
      )}

      {!isOpen && showTooltip && (
        <div className="chat-slide-up fixed bottom-24 right-6 z-40 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 text-xs whitespace-nowrap text-foreground shadow-none">
          Ask Pulse AI anything
          <div className="absolute right-6 bottom-0 translate-y-full border-4 border-transparent border-t-border" />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setHasNewMessage(false)
          setShowTooltip(false)
        }}
        className="group fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
        aria-label={isOpen ? "Close Pulse AI chat" : "Open Pulse AI chat"}
      >
        <span className="relative flex items-center justify-center">
          {isOpen ? (
            <X size={22} />
          ) : (
            <Activity size={22} />
          )}
        </span>
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-destructive text-[9px] font-medium text-primary-foreground">
            1
          </span>
        )}
      </button>
    </>
  )
}
