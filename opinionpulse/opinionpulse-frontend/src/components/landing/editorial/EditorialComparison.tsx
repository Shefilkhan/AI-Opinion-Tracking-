import { Link } from "react-router-dom"
import type { ComparisonCell } from "@/data/pricingData"
import { editorialComparisonRows } from "@/data/landingEditorialData"

function CellValue({ value }: { value: ComparisonCell }) {
  if (value === true) return <span className="le-check">✓</span>
  if (value === false) return <span className="le-dash">—</span>
  return <span className="text-[var(--le-muted)]">{value}</span>
}

export function EditorialComparison() {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="le-container">
        <div className="mb-10 text-center">
          <h2 className="le-section-title mb-4">Why choose OpinionPulse?</h2>
          <Link to="/pricing" className="le-btn-sage">
            View full pricing
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--le-border)] bg-[var(--le-surface)]">
          <table className="le-comparison-table min-w-[640px]">
            <thead>
              <tr>
                <th className="w-[40%]" />
                <th>Starter</th>
                <th>Pro</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {editorialComparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>
                    <CellValue value={row.starter} />
                  </td>
                  <td>
                    <CellValue value={row.pro} />
                  </td>
                  <td>
                    <CellValue value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
