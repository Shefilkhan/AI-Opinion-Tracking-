import { useEffect, useState } from "react"
import { Activity, X } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { useAuth } from "@/contexts/AuthContext"
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
        <div className="chat-slide-up fixed bottom-24 right-6 z-50 flex h-[520px] w-96 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#2d2d44] dark:bg-[#1e1e30] dark:shadow-black/50">
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
        <div className="chat-slide-up fixed bottom-24 right-6 z-40 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg">
          Ask Pulse AI anything
          <div className="absolute right-6 bottom-0 translate-y-full border-4 border-transparent border-t-gray-900" />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setHasNewMessage(false)
          setShowTooltip(false)
        }}
        className="group fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg transition-all duration-300 hover:scale-110 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-300"
        aria-label={isOpen ? "Close Pulse AI chat" : "Open Pulse AI chat"}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-20" />
        <span className="relative flex items-center justify-center">
          {isOpen ? (
            <X size={22} className="text-white" />
          ) : (
            <Activity
              size={22}
              className={cn("text-white", "animate-pulse")}
            />
          )}
        </span>
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white">
            1
          </span>
        )}
      </button>
    </>
  )
}
