import { useState } from "react"
import { Bell, Plus } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { btnPrimary } from "@/lib/ui-classes"

type AlertRule = {
  id: string
  keyword: string
  threshold: string
  frequency: string
  enabled: boolean
}

const STORAGE_KEY = "opinionpulse_alerts"

function loadAlerts(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AlertRule[]) : []
  } catch {
    return []
  }
}

function saveAlerts(rules: AlertRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>(loadAlerts)
  const [keyword, setKeyword] = useState("")
  const [threshold, setThreshold] = useState("70")
  const [frequency, setFrequency] = useState("daily")

  function addAlert() {
    if (!keyword.trim()) return
    const next = [
      ...alerts,
      {
        id: crypto.randomUUID(),
        keyword: keyword.trim(),
        threshold: `> ${threshold}% negative`,
        frequency,
        enabled: true,
      },
    ]
    setAlerts(next)
    saveAlerts(next)
    setKeyword("")
  }

  function toggle(id: string, enabled: boolean) {
    const next = alerts.map((a) => (a.id === id ? { ...a, enabled } : a))
    setAlerts(next)
    saveAlerts(next)
  }

  return (
    <DashboardLayout
      title="Alerts"
      subtitle="Get notified when sentiment spikes on keywords you care about"
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-foreground">New alert</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Backend delivery is coming soon — rules are saved locally for now.
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword e.g. Bitcoin"
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
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
                  className="mt-1 block h-10 w-24 rounded-lg border border-gray-200 px-2 text-sm"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Frequency
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="mt-1 block h-10 rounded-lg border border-gray-200 px-2 text-sm"
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily</option>
                </select>
              </label>
            </div>
            <Button type="button" className={btnPrimary} onClick={addAlert}>
              <Plus className="size-4" />
              Add alert
            </Button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <Bell className="mx-auto size-10 text-muted-foreground/50" />
            <p className="mt-4 font-medium">Set up your first alert</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor keywords when negative sentiment crosses your threshold.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4"
              >
                <div>
                  <p className="font-medium text-foreground">{a.keyword}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.threshold} · {a.frequency}
                  </p>
                </div>
                <Toggle
                  id={`alert-${a.id}`}
                  label="Enabled"
                  checked={a.enabled}
                  onCheckedChange={(v) => toggle(a.id, v)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  )
}
