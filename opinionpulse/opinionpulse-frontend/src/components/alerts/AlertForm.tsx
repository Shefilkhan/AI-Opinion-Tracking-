import { useState } from "react"
import { Plus } from "lucide-react"
import type { AlertCreate, AlertType } from "@/api/alerts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { inputSurface, selectSurface, cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCES = ["reddit", "youtube", "gdelt", "hackernews", "manual"] as const

type AlertFormProps = {
  onSubmit: (data: AlertCreate) => void
  loading?: boolean
  error?: string | null
}

export function AlertForm({ onSubmit, loading, error }: AlertFormProps) {
  const [alertType, setAlertType] = useState<AlertType>("negative_sentiment")
  const [threshold, setThreshold] = useState("30")
  const [keyword, setKeyword] = useState("")
  const [source, setSource] = useState<(typeof SOURCES)[number]>("reddit")
  const [isActive, setIsActive] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    const value = Number(threshold)
    if (Number.isNaN(value) || value <= 0) {
      setLocalError("Enter a valid threshold greater than 0.")
      return
    }
    if (alertType === "negative_sentiment" && value > 100) {
      setLocalError("Percentage threshold cannot exceed 100.")
      return
    }
    if (alertType === "keyword_mention" && !keyword.trim()) {
      setLocalError("Keyword is required for keyword mention alerts.")
      return
    }

    const data: AlertCreate = {
      alert_type: alertType,
      threshold_value: value,
      is_active: isActive,
    }
    if (alertType === "keyword_mention") {
      data.keyword = keyword.trim()
    }
    if (alertType === "source_volume") {
      data.source = source
    }
    onSubmit(data)
  }

  const thresholdLabel =
    alertType === "negative_sentiment"
      ? "Threshold (%)"
      : "Threshold (mention count)"

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Create alert rule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Alert type</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className={cn(selectSurface, "h-10 w-full")}
            >
              <option value="negative_sentiment">Negative sentiment</option>
              <option value="high_volume">High mention volume</option>
              <option value="keyword_mention">Keyword mention</option>
              <option value="source_volume">Source volume</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{thresholdLabel}</label>
            <input
              type="number"
              min={1}
              max={alertType === "negative_sentiment" ? 100 : undefined}
              step={alertType === "negative_sentiment" ? 1 : 1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className={cn("w-full rounded-lg px-3 py-2 text-sm", inputSurface)}
            />
          </div>

          {alertType === "keyword_mention" && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. price, battery, support"
                className={cn("w-full rounded-lg px-3 py-2 text-sm", inputSurface)}
              />
            </div>
          )}

          {alertType === "source_volume" && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as (typeof SOURCES)[number])}
                className={cn(selectSurface, "h-10 w-full")}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-200"
            />
            Active
          </label>

          {(localError || error) && (
            <p className="text-sm text-destructive" role="alert">
              {localError || error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 bg-primary text-primary-foreground text-foreground"
          >
            <Plus className="size-4" />
            {loading ? "Creating…" : "Create alert"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
