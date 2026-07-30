import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  Download,
  FileText,
  Loader2,
  Plus,
  Radar,
  RefreshCw,
  Shield,
  Trash2,
  Zap,
} from "lucide-react"
import {
  createBrandWatch,
  deleteBrandWatch,
  fetchResponseBrief,
  downloadWeeklyReport,
  listBrandWatches,
  updateBrandWatch,
  type BrandWatch,
  type ResponseBrief,
} from "@/api/brandWatches"
import { useCrisisRadar } from "@/hooks/useCrisisRadar"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { EmptyState } from "@/components/layout/EmptyState"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { PageSection } from "@/components/layout/PageSection"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { btnPrimary, proCard, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function AlertsPage() {
  const queryClient = useQueryClient()
  const { data: radar } = useCrisisRadar()
  const [watches, setWatches] = useState<BrandWatch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [product, setProduct] = useState("")
  const [ceo, setCeo] = useState("")
  const [aliases, setAliases] = useState("")
  const [threshold, setThreshold] = useState("70")
  const [frequency, setFrequency] = useState("instant")

  const [briefWatchId, setBriefWatchId] = useState<string | null>(null)
  const [brief, setBrief] = useState<ResponseBrief | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)

  async function loadWatches() {
    setLoading(true)
    setError(null)
    try {
      setWatches(await listBrandWatches())
    } catch {
      setError("Could not load brand watches.")
      setWatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWatches()
  }, [])

  const spikeByWatch = new Map(
    (radar?.points ?? []).map((p) => [p.watch_id, p])
  )

  async function addWatch() {
    if (!name.trim() || !brand.trim()) return
    setSaving(true)
    setError(null)
    try {
      const created = await createBrandWatch({
        name: name.trim(),
        brand: brand.trim(),
        product: product.trim() || undefined,
        ceo: ceo.trim() || undefined,
        aliases: aliases
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        threshold: parseInt(threshold, 10),
        frequency,
      })
      setWatches((prev) => [created, ...prev])
      setName("")
      setBrand("")
      setProduct("")
      setCeo("")
      setAliases("")
      void queryClient.invalidateQueries({ queryKey: ["crisis-radar"] })
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create watch")
    } finally {
      setSaving(false)
    }
  }

  async function toggleWatch(id: string, enabled: boolean) {
    const prev = watches
    setWatches((w) => w.map((x) => (x.id === id ? { ...x, enabled } : x)))
    try {
      await updateBrandWatch(id, { enabled })
      void queryClient.invalidateQueries({ queryKey: ["crisis-radar"] })
    } catch {
      setWatches(prev)
    }
  }

  async function removeWatch(id: string) {
    const prev = watches
    setWatches((w) => w.filter((x) => x.id !== id))
    try {
      await deleteBrandWatch(id)
      void queryClient.invalidateQueries({ queryKey: ["crisis-radar"] })
    } catch {
      setWatches(prev)
    }
  }

  async function loadBrief(watchId: string) {
    setBriefWatchId(watchId)
    setBriefLoading(true)
    setBrief(null)
    try {
      setBrief(await fetchResponseBrief(watchId))
    } catch {
      setBrief(null)
    } finally {
      setBriefLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Brand Monitor"
      subtitle="Tell me when people talk about you — and whether it's getting worse"
    >
      <Link
        to="/crisis"
        className={cn(
          proCard,
          "mb-6 flex items-center gap-3 border-red-500/20 bg-red-500/5 p-4 transition-colors hover:bg-red-500/10"
        )}
      >
        <Radar className="size-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-[var(--dash-text)]">Crisis Radar</p>
          <p className="text-xs text-[var(--dash-text-mid)]">
            Baseline vs spike · volume × velocity quadrant · act before stories spread
          </p>
        </div>
        <span className="ml-auto text-xs font-medium text-[var(--dash-accent)]">Open →</span>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start lg:gap-8">
        <PageSection title="New watchlist" className="mb-0">
          <div className={cn(proCard, "p-5")}>
            <p className="mb-4 text-xs text-muted-foreground">
              Bundle brand, product, CEO, and misspellings into one monitor.
            </p>
            {error && (
              <InlineNotice variant="warning" className="mb-4">
                {error}
              </InlineNotice>
            )}
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Watch name e.g. Acme Corp"
                className={cn(inputSurface, "h-11 w-full")}
              />
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand name *"
                className={cn(inputSurface, "h-11 w-full")}
              />
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Product (optional)"
                className={cn(inputSurface, "h-11 w-full")}
              />
              <input
                type="text"
                value={ceo}
                onChange={(e) => setCeo(e.target.value)}
                placeholder="CEO / founder (optional)"
                className={cn(inputSurface, "h-11 w-full")}
              />
              <input
                type="text"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="Misspellings & aliases, comma-separated"
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
                  Alerts
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className={cn(inputSurface, "mt-1 block h-10")}
                  >
                    <option value="instant">Instant (crisis)</option>
                    <option value="daily">Daily digest</option>
                  </select>
                </label>
              </div>
              <Button
                type="button"
                className={btnPrimary}
                onClick={() => void addWatch()}
                disabled={saving || !name.trim() || !brand.trim()}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {saving ? "Creating…" : "Create watchlist"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Configure email & Slack in{" "}
                <Link to="/settings" className="text-primary hover:underline">
                  Settings → Notifications
                </Link>
              </p>
            </div>
          </div>
        </PageSection>

        <PageSection
          title="Your watchlists"
          description={
            watches.length > 0
              ? `${watches.length} bundle${watches.length === 1 ? "" : "s"} monitored`
              : undefined
          }
          className="mb-0"
        >
          {loading ? (
            <div className={cn(proCard, "flex items-center justify-center gap-3 p-8")}>
              <RefreshCw className="size-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading…</span>
            </div>
          ) : watches.length === 0 ? (
            <div className={cn(proCard, "border-dashed")}>
              <EmptyState
                icon={Shield}
                title="Monitor your reputation"
                description="Add a watchlist to track brand mentions, spikes, and crisis signals."
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {watches.map((w) => {
                const spike = spikeByWatch.get(w.id)
                return (
                  <li key={w.id} className={cn(proCard, "p-4")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{w.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {w.terms.length} terms · &gt; {w.threshold}% negative · {w.frequency}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {w.terms.slice(0, 4).join(" · ")}
                          {w.terms.length > 4 ? ` +${w.terms.length - 4} more` : ""}
                        </p>
                        {spike && (
                          <div
                            className={cn(
                              "mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                              spike.spike_severity === "critical" && "bg-red-500/10 text-red-600",
                              spike.spike_severity === "elevated" && "bg-orange-500/10 text-orange-600",
                              spike.spike_severity === "watch" && "bg-amber-500/10 text-amber-700",
                              (!spike.spike_severity || spike.spike_severity === "normal") &&
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            <Zap className="size-3" />
                            {spike.spike_label ?? "Within normal range"}
                          </div>
                        )}
                      </div>
                      <Toggle
                        id={`watch-${w.id}`}
                        label="Active"
                        checked={w.enabled}
                        onCheckedChange={(v) => void toggleWatch(w.id, v)}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => void loadBrief(w.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <FileText className="size-3.5" />
                        Response brief
                      </button>
                      <button
                        type="button"
                        onClick={() => void downloadWeeklyReport(w.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <Download className="size-3.5" />
                        Weekly report
                      </button>
                      <Link
                        to={`/crisis?watch=${encodeURIComponent(w.brand)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <Radar className="size-3.5" />
                        Crisis Radar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void removeWatch(w.id)}
                        className="ml-auto rounded p-1.5 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${w.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </PageSection>
      </div>

      {briefWatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={cn(proCard, "max-h-[85vh] w-full max-w-lg overflow-y-auto p-6")}>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Response brief</h3>
                <p className="text-xs text-muted-foreground">
                  3 talking points + 2 risks from live sources only
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBriefWatchId(null)
                  setBrief(null)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            {briefLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : brief ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Talking points
                  </p>
                  <ol className="list-decimal space-y-2 pl-4">
                    {brief.talking_points.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                    Risks
                  </p>
                  <ul className="list-disc space-y-2 pl-4">
                    {brief.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {brief.source_count} live posts
                  {brief.ai_generated ? " · AI summarized" : " · fallback template"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Could not generate brief.</p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
