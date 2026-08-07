import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
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

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        title={isOpen ? "Close Pulse AI" : "Ask Pulse AI"}
        className="group fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-none transition-colors duration-150 hover:bg-primary/90"
        aria-label={isOpen ? "Close Pulse AI chat" : "Open Pulse AI chat"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
