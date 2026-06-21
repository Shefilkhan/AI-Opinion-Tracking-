import { useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "@/api/client"
import { fetchPublicDemoSearch, type PublicDemoResult } from "@/api/explore"
import { DashboardPreview } from "@/components/explore/DashboardPreview"
import { SandboxCursor } from "@/components/explore/SandboxCursor"
import { EditorialNavbar } from "@/components/landing/editorial/EditorialNavbar"
import { EditorialFooter } from "@/components/landing/editorial/EditorialFooter"
import { SAMPLE_DASHBOARD } from "@/data/exploreSampleData"
import { cn } from "@/lib/utils"
import "@/styles/landing-editorial.css"
import "@/styles/explore.css"

type TopicId = "bitcoin" | "ai" | "climate"
type SandboxView = TopicId | "dashboard"

type DisplayResult = {
  platform: string
  pColor: string
  author: string
  time: string
  sentiment?: "pos" | "neg" | "neu"
  title: string
  likes?: string
  comments?: string
}

interface TopicData {
  id: TopicId
  label: string
  icon: string
  results: DisplayResult[]
  aiSummary: string
}

const SAMPLE_TOPICS: Record<TopicId, TopicData> = {
  bitcoin: {
    id: "bitcoin",
    label: "Bitcoin",
    icon: "₿",
    results: [
      {
        platform: "reddit",
        pColor: "#FF4500",
        author: "u/cryptoanalyst",
        time: "2m ago",
        sentiment: "pos",
        title:
          "Bitcoin just hit a new milestone! Institutional adoption rate is incredible right now.",
        likes: "4.8K",
        comments: "342",
      },
      {
        platform: "youtube",
        pColor: "#FF0000",
        author: "CoinBureau",
        time: "18m ago",
        sentiment: "neg",
        title: "Bitcoin faces massive headwinds as macro uncertainty grips markets.",
        likes: "18.1K",
        comments: "892",
      },
      {
        platform: "newsapi",
        pColor: "#2563EB",
        author: "Reuters",
        time: "2h ago",
        sentiment: "pos",
        title:
          "Bitcoin price stabilizes as institutional investors show renewed confidence.",
        likes: "2.3K",
        comments: "124",
      },
    ],
    aiSummary:
      "Sentiment is divided but leaning positive — institutional optimism around adoption is outweighing short-term price volatility concerns.",
  },
  ai: {
    id: "ai",
    label: "AI",
    icon: "◆",
    results: [
      {
        platform: "hackernews",
        pColor: "#FF6600",
        author: "devthrowaway",
        time: "8m ago",
        sentiment: "pos",
        title:
          "AI coding assistants have fundamentally changed how our team ships features.",
        likes: "891",
        comments: "234",
      },
      {
        platform: "devto",
        pColor: "#7C3AED",
        author: "sarah_codes",
        time: "34m ago",
        sentiment: "neu",
        title:
          "A balanced look at AI tooling: where it helps, where it still falls short.",
        likes: "412",
        comments: "67",
      },
      {
        platform: "guardian",
        pColor: "#052962",
        author: "Tech Desk",
        time: "1h ago",
        sentiment: "neg",
        title:
          "Workers raise concerns over AI-driven job displacement in latest survey.",
        likes: "1.6K",
        comments: "503",
      },
    ],
    aiSummary:
      "Developers are largely enthusiastic about AI tooling productivity gains, while broader public discussion shows growing concern about job displacement.",
  },
  climate: {
    id: "climate",
    label: "Climate",
    icon: "◐",
    results: [
      {
        platform: "reddit",
        pColor: "#FF4500",
        author: "u/climatewatch",
        time: "14m ago",
        sentiment: "neg",
        title:
          "New report shows emissions targets are falling further behind schedule globally.",
        likes: "2.1K",
        comments: "418",
      },
      {
        platform: "guardian",
        pColor: "#052962",
        author: "Environment Desk",
        time: "47m ago",
        sentiment: "neu",
        title:
          "Summit negotiators remain divided on implementation timelines ahead of vote.",
        likes: "980",
        comments: "201",
      },
      {
        platform: "mastodon",
        pColor: "#6364FF",
        author: "@climateaction",
        time: "1h ago",
        sentiment: "pos",
        title:
          "Renewable energy adoption exceeded projections in three major economies this quarter.",
        likes: "654",
        comments: "89",
      },
    ],
    aiSummary:
      "Conversation is split fairly evenly — frustration over policy delays is balanced by genuine optimism about renewable energy adoption rates.",
  },
}

const TOPIC_PILLS: { id: SandboxView; label: string; icon: string }[] = [
  { id: "bitcoin", label: "Bitcoin", icon: "₿" },
  { id: "ai", label: "AI", icon: "◆" },
  { id: "climate", label: "Climate", icon: "◐" },
  { id: "dashboard", label: "Dashboard view", icon: "▦" },
]

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  youtube: "#FF0000",
  guardian: "#052962",
  newsapi: "#2563EB",
  hackernews: "#FF6600",
  devto: "#7C3AED",
  mastodon: "#6364FF",
  github: "#24292F",
}

const BENEFITS = [
  {
    icon: "🌐",
    title: "See every angle, instantly",
    body: "Most tools show you one platform at a time. OpinionPulse searches Reddit, YouTube, Bluesky, Mastodon, GitHub, and news outlets simultaneously — so you see the full picture, not a fragment of it.",
    stat: "13 sources, one search",
  },
  {
    icon: "🤖",
    title: "AI that explains, not just counts",
    body: "A percentage doesn't tell you why. Pulse AI reads every result and writes a plain-English explanation of what people think and what's driving that sentiment.",
    stat: "Free, instant analysis",
  },
  {
    icon: "⚖️",
    title: "Both sides, fairly presented",
    body: "When opinion is split, OpinionPulse detects it and shows you both perspectives with equal weight — never cherry-picked, never biased toward the loudest voice.",
    stat: "Balanced debate detection",
  },
  {
    icon: "📈",
    title: "Know where it's heading",
    body: "Today's sentiment is useful. Tomorrow's is more useful. OpinionPulse analyzes momentum and forecasts where public opinion is likely to shift over the next 7 days.",
    stat: "7-day trend prediction",
  },
]

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatRelativeTime(iso: string): string {
  const posted = new Date(iso).getTime()
  if (Number.isNaN(posted)) return "recently"
  const diffMs = Date.now() - posted
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function mapApiResult(result: PublicDemoResult): DisplayResult {
  const sentiment =
    result.sentiment === "positive"
      ? "pos"
      : result.sentiment === "negative"
        ? "neg"
        : "neu"

  return {
    platform: result.platform,
    pColor: PLATFORM_COLORS[result.platform] ?? "#6B6560",
    author: result.author || "Unknown",
    time: formatRelativeTime(result.posted_at),
    sentiment,
    title: result.title || result.content.slice(0, 220),
    likes: formatCount(result.engagement?.likes ?? 0),
    comments: formatCount(result.engagement?.comments ?? 0),
  }
}

function sentimentLabel(sentiment: DisplayResult["sentiment"]) {
  if (sentiment === "pos") return { text: "✓ Positive", color: "#16A34A" }
  if (sentiment === "neg") return { text: "✗ Negative", color: "#DC2626" }
  return { text: "— Neutral", color: "#A8A29E" }
}

function ExplanationPanel() {
  const [activeBenefit, setActiveBenefit] = useState(0)

  return (
    <div className="explore-left-panel">
      <span className="explore-kicker">Interactive sandbox</span>

      <h1 className="explore-headline">
        Click a topic.
        <br />
        <span className="explore-headline-outline">See the pulse instantly.</span>
      </h1>

      <p className="explore-intro">
        No auto-play, no timers — explore pre-built sample topics or run a real
        search against live sources. Everything updates when you click.
      </p>

      <div className="explore-benefits">
        {BENEFITS.map((benefit, i) => (
          <button
            key={benefit.title}
            type="button"
            onClick={() => setActiveBenefit(i)}
            className={cn(
              "explore-benefit-btn",
              activeBenefit === i && "explore-benefit-btn-active"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{benefit.icon}</span>
              <div>
                <p
                  className="explore-benefit-title"
                  style={{ marginBottom: activeBenefit === i ? "0.375rem" : 0 }}
                >
                  {benefit.title}
                </p>
                {activeBenefit === i && (
                  <>
                    <p className="explore-benefit-body">{benefit.body}</p>
                    <span className="explore-benefit-stat">{benefit.stat}</span>
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Link to="/auth/signup" className="explore-cta">
        Get started free →
      </Link>
    </div>
  )
}

function DemoPanel({
  activeView,
  onViewClick,
  hasInteracted,
  isUserSearch,
  userQuery,
  setUserQuery,
  handleUserSearch,
  userResults,
  userLoading,
  searchError,
}: {
  activeView: SandboxView
  onViewClick: (view: SandboxView) => void
  hasInteracted: boolean
  isUserSearch: boolean
  userQuery: string
  setUserQuery: (value: string) => void
  handleUserSearch: (e: FormEvent) => void
  userResults: DisplayResult[]
  userLoading: boolean
  searchError: string | null
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const topicData = activeView !== "dashboard" ? SAMPLE_TOPICS[activeView] : null
  const displayResults = isUserSearch ? userResults : topicData?.results ?? []
  const displaySummary = isUserSearch ? null : topicData?.aiSummary ?? null
  const displayLabel = isUserSearch ? userQuery : topicData?.label ?? "Dashboard"

  return (
    <div className="explore-demo-panel">
      {!hasInteracted && (
        <p className="explore-sandbox-hint">
          <span className="explore-sandbox-hint-arrow" aria-hidden>
            →
          </span>
          Click a topic below to see live results
        </p>
      )}

      <div className="explore-topic-row">
        {TOPIC_PILLS.map((pill) => {
          const isActive = !isUserSearch && activeView === pill.id
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onViewClick(pill.id)}
              className={cn("explore-topic-pill", isActive && "explore-topic-pill-active")}
            >
              <span>{pill.icon}</span>
              {pill.label}
            </button>
          )
        })}

        <form onSubmit={handleUserSearch} className="explore-topic-search-form">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Or type your own topic..."
            className="explore-topic-search-input"
          />
        </form>
      </div>

      {searchError && <p className="explore-search-error">{searchError}</p>}

      <div ref={frameRef} className="demo-sandbox-frame">
        <SandboxCursor containerRef={frameRef} />

        {userLoading ? (
          <div className="explore-sandbox-loading">
            <div className="explore-sandbox-spinner" aria-hidden />
          </div>
        ) : activeView === "dashboard" && !isUserSearch ? (
          <DashboardPreview data={SAMPLE_DASHBOARD} />
        ) : (
          <div key={`${activeView}-${isUserSearch ? userQuery : "sample"}`}>
            <p className="explore-sandbox-meta">
              {displayResults.length} results for &ldquo;{displayLabel}&rdquo;
            </p>

            <div className="explore-sandbox-results">
              {displayResults.map((result, i) => {
                const sentiment = result.sentiment
                  ? sentimentLabel(result.sentiment)
                  : null
                return (
                  <div
                    key={`${result.platform}-${i}`}
                    className="explore-sandbox-result"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="explore-result-head">
                      <span
                        className="explore-platform-badge"
                        style={{
                          background: `${result.pColor}15`,
                          color: result.pColor,
                        }}
                      >
                        {result.platform}
                      </span>
                      <span className="explore-result-meta">
                        {result.author} · {result.time}
                      </span>
                      {sentiment && (
                        <span
                          className="explore-sentiment-badge"
                          style={{ color: sentiment.color }}
                        >
                          {sentiment.text}
                        </span>
                      )}
                    </div>
                    <p className="explore-result-title">{result.title}</p>
                  </div>
                )
              })}
            </div>

            {displaySummary && (
              <div className="explore-sandbox-ai">
                <div className="explore-ai-label">
                  <span className="explore-ai-dot" aria-hidden />
                  PULSE AI — POWERED BY GROQ
                </div>
                <p className="explore-sandbox-ai-quote">&ldquo;{displaySummary}&rdquo;</p>
              </div>
            )}

            {!displaySummary && isUserSearch && displayResults.length > 0 && (
              <div className="explore-sandbox-signup">
                <p>AI analysis is available with a free account</p>
                <Link to="/auth/signup">Sign up free →</Link>
              </div>
            )}

            {!displaySummary && isUserSearch && displayResults.length === 0 && (
              <div className="explore-sandbox-signup">
                <p>No results found — try another topic or sign up for full access.</p>
                <Link to="/auth/signup">Sign up free →</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ExplorePage() {
  const [activeView, setActiveView] = useState<SandboxView>("bitcoin")
  const [hasInteracted, setHasInteracted] = useState(false)
  const [userQuery, setUserQuery] = useState("")
  const [isUserSearch, setIsUserSearch] = useState(false)
  const [userResults, setUserResults] = useState<DisplayResult[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  function handleViewClick(view: SandboxView) {
    setIsUserSearch(false)
    setSearchError(null)
    setActiveView(view)
    setHasInteracted(true)
  }

  async function handleUserSearch(e: FormEvent) {
    e.preventDefault()
    const query = userQuery.trim()
    if (query.length < 2) return

    setUserLoading(true)
    setIsUserSearch(true)
    setHasInteracted(true)
    setSearchError(null)

    try {
      const data = await fetchPublicDemoSearch(query)
      setUserResults(data.results.map(mapApiResult))
    } catch (err) {
      setUserResults([])
      if (err instanceof ApiError) {
        setSearchError(err.detail)
      } else {
        setSearchError("Search unavailable — sign up for full access.")
      }
    } finally {
      setUserLoading(false)
    }
  }

  return (
    <div className="landing-editorial explore-page">
      <EditorialNavbar />

      <div className="explore-grid">
        <ExplanationPanel />
        <DemoPanel
          activeView={activeView}
          onViewClick={handleViewClick}
          hasInteracted={hasInteracted}
          isUserSearch={isUserSearch}
          userQuery={userQuery}
          setUserQuery={setUserQuery}
          handleUserSearch={handleUserSearch}
          userResults={userResults}
          userLoading={userLoading}
          searchError={searchError}
        />
      </div>

      <EditorialFooter />
    </div>
  )
}
