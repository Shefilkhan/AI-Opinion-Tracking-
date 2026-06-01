import { Download, FilePlus, Printer } from "lucide-react"
import type { ReportType } from "@/api/reports"
import { downloadProjectCsv } from "@/api/reports"
import { Button } from "@/components/ui/button"
import { selectSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { useState } from "react"

type ReportActionsProps = {
  reportType: ReportType
  onReportTypeChange: (type: ReportType) => void
  onGenerate: () => void
  generating?: boolean
  projectId: number
}

export function ReportActions({
  reportType,
  onReportTypeChange,
  onGenerate,
  generating,
  projectId,
}: ReportActionsProps) {
  const [exporting, setExporting] = useState<"mentions" | "sentiment" | null>(null)

  async function handleExport(kind: "mentions" | "sentiment") {
    setExporting(kind)
    try {
      await downloadProjectCsv(projectId, kind)
    } finally {
      setExporting(null)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <select
        value={reportType}
        onChange={(e) => onReportTypeChange(e.target.value as ReportType)}
        className={cn(selectSurface, "h-10 min-w-[140px]")}
        aria-label="Report type"
      >
        <option value="custom">Custom</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
      <Button
        onClick={onGenerate}
        disabled={generating}
        className="gap-2 bg-primary text-primary-foreground text-foreground"
      >
        <FilePlus className="size-4" />
        {generating ? "Generating…" : "Generate Report"}
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        disabled={exporting !== null}
        onClick={() => handleExport("mentions")}
      >
        <Download className="size-4" />
        {exporting === "mentions" ? "Exporting…" : "Export Mentions CSV"}
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        disabled={exporting !== null}
        onClick={() => handleExport("sentiment")}
      >
        <Download className="size-4" />
        {exporting === "sentiment" ? "Exporting…" : "Export Sentiment CSV"}
      </Button>
      <Button variant="outline" className="gap-2" onClick={handlePrint}>
        <Printer className="size-4" />
        Print Report
      </Button>
    </div>
  )
}
