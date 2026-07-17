import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/api/notifications"
import { formatRelativeTime } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

const NOTIFICATIONS_QUERY_KEY = ["notifications"]

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => listNotifications(),
    refetchInterval: 30_000,
  })
}

export function NotificationPanel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useNotifications()

  const unreadCount = data?.unread_count ?? 0
  const items = data?.items ?? []

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  async function handleOpenItem(item: AppNotification) {
    if (!item.read) {
      await markReadMutation.mutateAsync(item.id)
    }
    setOpen(false)
    if (item.href) navigate(item.href)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-10 items-center justify-center rounded-full bg-[var(--dash-surface-alt)] text-[var(--dash-text-mid)] transition-colors hover:text-[var(--dash-text)]"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="size-[18px]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--dash-neg)] ring-2 ring-[var(--dash-surface)]" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[200] w-[min(92vw,22rem)] overflow-hidden rounded-[12px] border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between border-b border-[var(--dash-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--dash-text)]">Notifications</p>
              <p className="text-xs text-[var(--dash-text-faint)]">
                Activity updates for your account
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--dash-accent)] transition-colors hover:bg-[var(--dash-accent-soft)]"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CheckCheck className="size-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-[var(--dash-text-faint)]">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 size-5 text-[var(--dash-text-faint)]" />
                <p className="text-sm font-medium text-[var(--dash-text)]">No notifications yet</p>
                <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
                  Important activity like alerts and security updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--dash-border)]">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void handleOpenItem(item)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--dash-surface-alt)]",
                        !item.read && "bg-[var(--dash-accent-soft)]/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          item.read
                            ? "bg-transparent"
                            : "bg-[var(--dash-accent)]"
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-[var(--dash-text)]">
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--dash-text-faint)]">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--dash-text-mid)]">
                          {item.message}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
