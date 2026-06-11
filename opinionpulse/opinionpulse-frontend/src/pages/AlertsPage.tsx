import { useEffect, useState } from "react"
import { Bell, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import {
  createPersonalAlert,
  deletePersonalAlert,
  listPersonalAlerts,
  updatePersonalAlert,
  type PersonalAlert,
} from "@/api/alerts"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { EmptyState } from "@/components/layout/EmptyState"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { PageSection } from "@/components/layout/PageSection"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { btnPrimary, proCard, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

// ─── Local-only fallback (used when backend API is not available) ──────────
const LS_KEY = "opinionpulse_alerts"

function lsLoad(): PersonalAlert[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as PersonalAlert[]) : []
  } catch {
    return []
  }
}

function lsSave(rules: PersonalAlert[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rules))
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<PersonalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [useBackend, setUseBackend] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [threshold, setThreshold] = useState("70")
  const [frequency, setFrequency] = useState("daily")
  const [error, setError] = useState<string | null>(null)

  // Load from backend, fallback to localStorage
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listPersonalAlerts()
        setAlerts(data)
        setUseBackend(true)
        // Sync backend data to localStorage as backup
        lsSave(data)
      } catch {
        // Backend unavailable — use local data
        setUseBackend(false)
        setAlerts(lsLoad())
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function addAlert() {
    if (!keyword.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (useBackend) {
        const created = await createPersonalAlert({
          keyword: keyword.trim(),
          threshold: parseInt(threshold, 10),
          frequency,
        })
        const next = [created, ...alerts]
        setAlerts(next)
        lsSave(next)
      } else {
        const next: PersonalAlert[] = [
          {
            id: crypto.randomUUID(),
            keyword: keyword.trim(),
            threshold: parseInt(threshold, 10),
            frequency,
            enabled: true,
          },
          ...alerts,
        ]
        setAlerts(next)
        lsSave(next)
      }
      setKeyword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert")
    } finally {
      setSaving(false)
    }
  }

  async function toggleAlert(id: string, enabled: boolean) {
    const prev = alerts
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, enabled } : x)))
    try {
      if (useBackend) {
        await updatePersonalAlert(id, { enabled })
        lsSave(alerts.map((x) => (x.id === id ? { ...x, enabled } : x)))
      } else {
        lsSave(prev.map((x) => (x.id === id ? { ...x, enabled } : x)))
      }
    } catch {
      // Revert on error
      setAlerts(prev)
    }
  }

  async function removeAlert(id: string) {
    const prev = alerts
    setAlerts((a) => a.filter((x) => x.id !== id))
    lsSave(prev.filter((x) => x.id !== id))
    try {
      if (useBackend) {
        await deletePersonalAlert(id)
      }
    } catch {
      // Revert on error
      setAlerts(prev)
    }
  }

  return (
    <DashboardLayout
      title="Alerts"
      subtitle="Get notified when sentiment spikes on keywords you care about"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start lg:gap-8">
        <PageSection title="New alert" className="mb-0">
          <div className={cn(proCard, "p-5")}>
            {!useBackend && (
              <InlineNotice variant="warning" className="mb-4">
                Running in offline mode — alerts saved locally only.
              </InlineNotice>
            )}
            {error && (
              <InlineNotice variant="warning" className="mb-4">
                {error}
              </InlineNotice>
            )}
            <div className="space-y-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addAlert()
                }}
                placeholder="Keyword e.g. Bitcoin"
                className={cn(inputSurface, "h-11 w-full")}
              />
              <div className="flex flex-wrap gap-3">
                <label className="text-xs text-muted-foreground">
                  Threshold (% negative)
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className={cn(inputSurface, "mt-1 block h-10 w-24")}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Frequency
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className={cn(inputSurface, "mt-1 block h-10")}
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily</option>
                  </select>
                </label>
              </div>
              <Button
                type="button"
                className={btnPrimary}
                onClick={() => void addAlert()}
                disabled={saving || !keyword.trim()}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {saving ? "Adding…" : "Add alert"}
              </Button>
            </div>
          </div>
        </PageSection>

        <PageSection
          title="Your rules"
          description={
            alerts.length > 0
              ? `${alerts.length} alert${alerts.length === 1 ? "" : "s"} configured`
              : undefined
          }
          className="mb-0"
        >
          {loading ? (
            <div className={cn(proCard, "flex items-center justify-center gap-3 p-8")}>
              <RefreshCw className="size-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading alerts…</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className={cn(proCard, "border-dashed")}>
              <EmptyState
                icon={Bell}
                title="Set up your first alert"
                description="Monitor keywords when negative sentiment crosses your threshold."
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    proCard,
                    "flex items-center justify-between gap-3 px-4 py-3.5"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{a.keyword}</p>
                    <p className="text-xs text-muted-foreground">
                      &gt; {a.threshold}% negative · {a.frequency}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Toggle
                      id={`alert-${a.id}`}
                      label="Enabled"
                      checked={a.enabled}
                      onCheckedChange={(v) => void toggleAlert(a.id, v)}
                    />
                    <button
                      type="button"
                      onClick={() => void removeAlert(a.id)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Delete alert for ${a.keyword}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PageSection>
      </div>
    </DashboardLayout>
  )
}
