import type { ReportDetail } from "@/api/reports"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportSourceBreakdown } from "@/components/reports/ReportSourceBreakdown"
import { ReportSummaryCard } from "@/components/reports/ReportSummaryCard"
import { ReportTopMentions } from "@/components/reports/ReportTopMentions"
import { cardSurface } from "@/lib/ui-classes"

type ReportPreviewProps = {
  report: ReportDetail
}

export function ReportPreview({ report }: ReportPreviewProps) {
  return (
    <div id="report-print-area" className="report-print-area space-y-6">
      <div className="report-print-header hidden print:block">
        <h1 className="text-2xl font-bold text-black">OpinionPulse Report</h1>
        <p className="text-sm text-muted-foreground">{report.project_name}</p>
      </div>

      <Card className={`${cardSurface} report-print-card`}>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-foreground print:text-black">
              {report.project_name} — Opinion Report
            </CardTitle>
            <Badge variant="outline" className="capitalize border-primary/20 text-primary print:border-gray-400 print:text-gray-700">
              {report.report_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground print:text-muted-foreground">
            Generated {new Date(report.generated_at).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground print:text-foreground">
            {report.summary}
          </p>
          {report.keyword_hints.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground print:text-muted-foreground">
              Keywords: {report.keyword_hints.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="report-print-section">
        <ReportSummaryCard
          overview={report.overview}
          projectName={report.project_name}
          generatedAt={report.generated_at}
        />
      </div>

      <ReportSourceBreakdown items={report.source_breakdown} />
      <ReportTopMentions
        topPositive={report.top_positive}
        topNegative={report.top_negative}
      />
    </div>
  )
}
