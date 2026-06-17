import { Activity, TrendingUp } from "lucide-react"

const BAR_HEIGHTS = [48, 72, 58, 88, 64]
const BAR_COLORS = [
  "var(--le-forest)",
  "var(--le-sage)",
  "#c4a882",
  "#8a9a7a",
  "#d8dfd2",
]

export function AuthDashboardVisual() {
  return (
    <div className="le-auth-visual" aria-hidden>
      <div className="le-auth-visual-glow" />

      <div className="le-auth-visual-orb le-auth-visual-orb--forest">
        <TrendingUp className="size-4" strokeWidth={2} />
      </div>
      <div className="le-auth-visual-orb le-auth-visual-orb--tan">
        <Activity className="size-4" strokeWidth={2} />
      </div>

      <div className="le-auth-visual-card le-auth-visual-card--bars">
        <div className="le-auth-visual-card-head">
          <span className="le-auth-visual-card-title">Sentiment pulse</span>
          <span className="le-auth-visual-card-meta">13 sources</span>
        </div>
        <div className="le-auth-visual-bars">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="le-auth-visual-bar"
              style={{
                height: `${h}%`,
                background: BAR_COLORS[i],
              }}
            />
          ))}
        </div>
        <div className="le-auth-visual-legend">
          <span>Positive 42%</span>
          <span>Negative 31%</span>
        </div>
      </div>

      <div className="le-auth-visual-card le-auth-visual-card--line">
        <div className="le-auth-visual-card-head">
          <span className="le-auth-visual-card-title">Opinion trend</span>
          <span className="le-auth-visual-pill">Live</span>
        </div>
        <svg
          className="le-auth-visual-chart"
          viewBox="0 0 240 80"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="authLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--le-sage)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--le-sage)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 58 C30 52, 45 68, 70 44 S110 28, 140 38 S185 62, 240 22 L240 80 L0 80 Z"
            fill="url(#authLineFill)"
          />
          <path
            d="M0 58 C30 52, 45 68, 70 44 S110 28, 140 38 S185 62, 240 22"
            fill="none"
            stroke="var(--le-forest)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="70" cy="44" r="4" fill="#c4a882" stroke="#fff" strokeWidth="2" />
          <circle cx="140" cy="38" r="4" fill="var(--le-forest)" stroke="#fff" strokeWidth="2" />
          <circle cx="240" cy="22" r="4" fill="var(--le-sage)" stroke="#fff" strokeWidth="2" />
        </svg>
        <div className="le-auth-visual-chart-foot">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
          <span>Sun</span>
        </div>
      </div>

      <div className="le-auth-visual-stat">
        <span className="le-auth-visual-stat-value">12.4K</span>
        <span className="le-auth-visual-stat-label">mentions today</span>
      </div>
    </div>
  )
}
