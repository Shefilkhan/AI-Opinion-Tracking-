import { useEffect, useRef, useState } from "react"
import {
  Code2,
  LayoutGrid,
  Newspaper,
  PlayCircle,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Category = "all" | "social" | "news" | "tech" | "video"

interface CategoryConfig {
  id: Category
  label: string
  icon: LucideIcon
  image?: string
  description: string
  accentBg: string
  sourceLabel: string
  pulseHeights: number[]
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "all",
    label: "All",
    icon: LayoutGrid,
    image: "/hero/hero-all.jpg",
    description:
      "Search Reddit, YouTube, Bluesky, Mastodon, GitHub, news outlets, and more — then let AI summarize what the world is saying.",
    accentBg: "#D9E2C9",
    sourceLabel: "13 sources",
    pulseHeights: [0.5, 0.6, 0.45, 0.85, 0.7, 0.75, 0.65],
  },
  {
    id: "social",
    label: "Social",
    icon: Users,
    image: "/hero/hero-social.jpg",
    description:
      "Track real conversations from Reddit, Bluesky, and Mastodon — millions of unfiltered voices, updated in real time.",
    accentBg: "#CFE0F2",
    sourceLabel: "3 sources",
    pulseHeights: [0.55, 0.72, 0.48, 0.8, 0.62, 0.7, 0.58],
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    image: "/hero/hero-news.jpg",
    description:
      "Cross-reference breaking stories from The Guardian, NewsAPI, GNews, Currents, and Mediastack — see how coverage compares.",
    accentBg: "#E8DDD0",
    sourceLabel: "5 sources",
    pulseHeights: [0.38, 0.45, 0.52, 0.48, 0.55, 0.42, 0.5],
  },
  {
    id: "tech",
    label: "Tech",
    icon: Code2,
    image: "/hero/hero-tech.jpg",
    description:
      "See what developers actually think — live from GitHub issues, Hacker News threads, and Dev.to discussions.",
    accentBg: "#D4DDE8",
    sourceLabel: "3 sources",
    pulseHeights: [0.6, 0.78, 0.65, 0.88, 0.72, 0.8, 0.68],
  },
  {
    id: "video",
    label: "Video",
    icon: PlayCircle,
    description:
      "Every YouTube comment, every reaction — Pulse AI watches the conversation so you don't have to scroll for hours.",
    accentBg: "#1A1814",
    sourceLabel: "1 source",
    pulseHeights: [0.48, 0.62, 0.55, 0.7, 0.58, 0.66, 0.6],
  },
]

const FLIP_MIDPOINT_MS = 300
const FLIP_DURATION_MS = 600

function getCategoryConfig(id: Category): CategoryConfig {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

const VIDEO_ID = "h_yQswsXwhY"

function VideoEmbed() {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
      title="Social Media Isn't Hard. It's Misunderstood. — Kallaway"
      className="hero-video-iframe"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )
}

function SentimentPulseOverlay({
  sourceLabel,
  pulseHeights,
}: {
  sourceLabel: string
  pulseHeights: number[]
}) {
  return (
    <div className="hero-sentiment-overlay">
      <p className="hero-sentiment-label">Sentiment Pulse</p>
      <div className="hero-sentiment-bars">
        {pulseHeights.map((h, i) => (
          <div
            key={i}
            className="hero-sentiment-bar"
            style={{
              height: `${h * 28}px`,
              transitionDelay: `${i * 0.03}s`,
            }}
          />
        ))}
      </div>
      <div className="hero-sentiment-stats">
        <span>Positive 42%</span>
        <span>{sourceLabel}</span>
      </div>
    </div>
  )
}

export function HeroCategoryShowcase() {
  const [active, setActive] = useState<Category>("all")
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">("forward")
  const [isFlipping, setIsFlipping] = useState(false)
  const [displayedCategory, setDisplayedCategory] = useState<Category>("all")
  const [displayedDescConfig, setDisplayedDescConfig] = useState<CategoryConfig>(CATEGORIES[0])
  const flipTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const activeIndex = CATEGORIES.findIndex((c) => c.id === active)
  const config = CATEGORIES[activeIndex]
  const displayedConfig = getCategoryConfig(displayedCategory)

  useEffect(() => {
    return () => {
      flipTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  function handleTabClick(id: Category) {
    if (id === active || isFlipping) return

    const newIndex = CATEGORIES.findIndex((c) => c.id === id)
    const oldIndex = CATEGORIES.findIndex((c) => c.id === active)

    setFlipDirection(newIndex > oldIndex ? "forward" : "backward")
    setIsFlipping(true)
    setActive(id)

    flipTimersRef.current.forEach(clearTimeout)
    flipTimersRef.current = [
      setTimeout(() => {
        setDisplayedCategory(id)
        setDisplayedDescConfig(getCategoryConfig(id))
      }, FLIP_MIDPOINT_MS),
      setTimeout(() => {
        setIsFlipping(false)
      }, FLIP_DURATION_MS),
    ]
  }

  return (
    <div className="hero-category-showcase">
      <div
        className="hero-showcase-frame"
        style={{ background: config.accentBg }}
      >
        <div className="hero-showcase-perspective">
          <div
            className={cn(
              "flip-card",
              isFlipping &&
                (flipDirection === "forward" ? "flipping-forward" : "flipping-backward")
            )}
          >
            <div className="flip-card-face">
              {displayedCategory === "video" ? (
                <VideoEmbed />
              ) : (
                <img
                  src={displayedConfig.image}
                  alt={`${displayedConfig.label} sentiment tracking`}
                  className="hero-showcase-image"
                />
              )}

              {displayedCategory !== "video" && (
                <SentimentPulseOverlay
                  sourceLabel={displayedConfig.sourceLabel}
                  pulseHeights={displayedConfig.pulseHeights}
                />
              )}
            </div>
          </div>
        </div>

        <div className="hero-showcase-notch" aria-hidden />
      </div>

      <div className="hero-category-tabs" role="tablist" aria-label="Source categories">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = active === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={isFlipping}
              onClick={() => handleTabClick(cat.id)}
              className={
                isActive ? "hero-category-tab hero-category-tab-active" : "hero-category-tab"
              }
              style={{
                opacity: isFlipping && !isActive ? 0.5 : 1,
                cursor: isFlipping ? "default" : "pointer",
                pointerEvents: isFlipping ? "none" : "auto",
              }}
            >
              <Icon size={15} strokeWidth={2} />
              {cat.label}
            </button>
          )
        })}
      </div>

      <p
        key={`desc-${displayedDescConfig.id}`}
        className="hero-desc-fade hero-category-description"
      >
        {displayedDescConfig.description}
      </p>
    </div>
  )
}
