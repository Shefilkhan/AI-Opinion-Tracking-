import { Link } from "react-router-dom"
import type { SampleDashboardData } from "@/data/exploreSampleData"

type DashboardPreviewProps = {
  data: SampleDashboardData
}

export function DashboardPreview({ data }: DashboardPreviewProps) {
  return (
    <div className="explore-dashboard-preview">
      <div className="explore-dashboard-kicker">
        <span className="explore-dashboard-kicker-dot" aria-hidden />
        <p>Your dashboard would look like this</p>
      </div>

      <div className="explore-dashboard-stats">
        <div className="explore-dashboard-balance">
          <p className="explore-dashboard-card-label">Sentiment balance</p>
          <p className="explore-dashboard-balance-value">
            {data.sentimentBalance.positivePercent}%
          </p>
          <p className="explore-dashboard-balance-sub">average positive sentiment</p>
          <div className="explore-dashboard-balance-meta">
            <div>
              <p className="explore-dashboard-meta-label">Trending</p>
              <p className="explore-dashboard-meta-value">{data.sentimentBalance.trendingCount}</p>
            </div>
            <div>
              <p className="explore-dashboard-meta-label">Sources</p>
              <p className="explore-dashboard-meta-value">
                {data.sentimentBalance.sourcesLive} live
              </p>
            </div>
          </div>
        </div>

        <div className="explore-dashboard-searches">
          <p className="explore-dashboard-searches-label">Searches today</p>
          <p className="explore-dashboard-searches-value">{data.searchesToday}</p>
          <p className="explore-dashboard-searches-sub">across all sources</p>
        </div>
      </div>

      <div className="explore-dashboard-weekly">
        <div className="explore-dashboard-weekly-head">
          <p className="explore-dashboard-weekly-title">Weekly activity</p>
          <div className="explore-dashboard-weekly-legend">
            <span>
              <span style={{ color: "#7C9A6E" }}>●</span> Positive
            </span>
            <span>
              <span style={{ color: "#1A1814" }}>●</span> Negative
            </span>
          </div>
        </div>

        <div className="explore-dashboard-bars">
          {data.weeklyActivity.map((d, i) => {
            const maxVal = 55
            return (
              <div key={d.day} className="explore-dashboard-bar-col">
                <div className="explore-dashboard-bar-pair">
                  <div
                    className="explore-dashboard-bar explore-dashboard-bar-positive"
                    style={{
                      height: `${(d.positive / maxVal) * 80}px`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                  <div
                    className="explore-dashboard-bar explore-dashboard-bar-negative"
                    style={{
                      height: `${(d.negative / maxVal) * 80}px`,
                      animationDelay: `${i * 0.05 + 0.03}s`,
                    }}
                  />
                </div>
                <span className="explore-dashboard-bar-day">{d.day}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="explore-dashboard-split">
        <div className="explore-dashboard-donut-card">
          <p className="explore-dashboard-split-title">Sentiment split</p>
          <DonutChart stats={data.sentimentStats} />
          <div className="explore-dashboard-legend">
            <LegendRow color="#7C9A6E" label="Positive" value={data.sentimentStats.positive} />
            <LegendRow color="#D4CFC4" label="Neutral" value={data.sentimentStats.neutral} />
            <LegendRow color="#1A1814" label="Negative" value={data.sentimentStats.negative} />
          </div>
        </div>

        <div className="explore-dashboard-debates">
          <p className="explore-dashboard-split-title">Latest opinion debates</p>
          <div className="explore-dashboard-debate-list">
            {data.debates.map((d, i) => (
              <div
                key={d.title}
                className={
                  i === 0
                    ? "explore-dashboard-debate-item explore-dashboard-debate-item-border"
                    : "explore-dashboard-debate-item"
                }
              >
                <div className="explore-dashboard-debate-head">
                  <span
                    className="explore-platform-badge"
                    style={{ background: `${d.pColor}15`, color: d.pColor }}
                  >
                    {d.platform}
                  </span>
                  <span className="explore-result-meta">{d.time}</span>
                </div>
                <p className="explore-dashboard-debate-title">{d.title}</p>
                <div className="explore-dashboard-debate-sentiment">
                  <span style={{ color: "#16A34A" }}>{d.sentiment.pos}% pos</span>
                  <span style={{ color: "#DC2626" }}>{d.sentiment.neg}% neg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="explore-dashboard-teaser">
        <p>Plus keyword alerts, AI predictions, debate detection, and 13 live sources.</p>
        <Link to="/auth/signup" className="explore-dashboard-teaser-cta">
          Get your own dashboard free →
        </Link>
      </div>
    </div>
  )
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: number
}) {
  return (
    <div className="explore-dashboard-legend-row">
      <span className="explore-dashboard-legend-swatch" style={{ background: color }} />
      <span className="explore-dashboard-legend-label">{label}</span>
      <span className="explore-dashboard-legend-value">{value}%</span>
    </div>
  )
}

function DonutChart({
  stats,
}: {
  stats: { positive: number; neutral: number; negative: number }
}) {
  const total = stats.positive + stats.neutral + stats.negative
  const posAngle = (stats.positive / total) * 360
  const neuAngle = (stats.neutral / total) * 360

  return (
    <div
      className="explore-dashboard-donut"
      style={{
        background: `conic-gradient(
          #7C9A6E 0deg ${posAngle}deg,
          #D4CFC4 ${posAngle}deg ${posAngle + neuAngle}deg,
          #1A1814 ${posAngle + neuAngle}deg 360deg
        )`,
      }}
    >
      <div className="explore-dashboard-donut-hole">
        <span className="explore-dashboard-donut-value">{stats.positive}%</span>
        <span className="explore-dashboard-donut-label">positive</span>
      </div>
    </div>
  )
}
