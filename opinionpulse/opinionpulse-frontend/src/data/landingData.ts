import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Database,
  Globe,
  MessagesSquare,
  Newspaper,
  Scale,
  Search,
  Server,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react"

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tech Stack", href: "#tech-stack" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "/pricing" },
] as const

export const trendingTopics = [
  "Bitcoin",
  "Climate Change",
  "Artificial Intelligence",
  "Elections 2024",
] as const

export const liveStats = [
  { value: 10, suffix: "+", label: "Data Sources Connected" },
  { value: 100, suffix: "K+", label: "Posts Analyzed Daily" },
  { value: 3, suffix: "", label: "AI Features Built-in" },
  { value: 99, suffix: "%", label: "Uptime Guaranteed" },
] as const

export const features: {
  title: string
  description: string
  icon: LucideIcon
  emoji: string
  iconBg: string
  highlighted?: boolean
}[] = [
  {
    emoji: "🔍",
    title: "Search Across 10 Sources",
    description:
      "Reddit, YouTube, Guardian, NewsAPI, Hacker News, Dev.to and more — searched simultaneously in seconds.",
    icon: Search,
    iconBg: "bg-primary/10 text-primary",
  },
  {
    emoji: "🤖",
    title: "AI-Powered Analysis",
    description:
      "Claude AI reads all results and generates a clear summary of what people actually think — and why.",
    icon: Brain,
    iconBg: "bg-blue-100 text-blue-600",
    highlighted: true,
  },
  {
    emoji: "⚖️",
    title: "Live Debate Detection",
    description:
      "Automatically identifies topics where opinions are sharply divided and presents both sides objectively.",
    icon: Scale,
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    emoji: "📈",
    title: "Sentiment Trend Prediction",
    description:
      "AI analyzes momentum and predicts where public opinion is heading over the next 7 days.",
    icon: TrendingUp,
    iconBg: "bg-green-100 text-green-600",
  },
  {
    emoji: "📊",
    title: "Live Opinion Dashboard",
    description:
      "See trending debates, most discussed topics, and platform-by-platform sentiment — all updating live.",
    icon: BarChart3,
    iconBg: "bg-pink-100 text-pink-600",
  },
  {
    emoji: "🔔",
    title: "Keyword Alerts",
    description:
      "Get notified when sentiment on any topic shifts significantly — before it becomes mainstream news.",
    icon: Bell,
    iconBg: "bg-yellow-100 text-yellow-600",
  },
]

export const howItWorksSteps = [
  {
    step: "01",
    title: "Search Any Topic",
    description:
      "Type any keyword, brand, person, or event. OpinionPulse searches 10 sources simultaneously.",
    emoji: "🔍",
  },
  {
    step: "02",
    title: "We Gather Live Data",
    description:
      "Real posts, articles, and videos are fetched from Reddit, YouTube, NewsAPI, and 7 more sources.",
    emoji: "📡",
  },
  {
    step: "03",
    title: "AI Generates Insights",
    description:
      "Claude AI analyzes sentiment, detects debates, and predicts where opinion is heading next.",
    emoji: "🤖",
  },
]

export const techStackItems: {
  name: string
  abbr: string
  highlighted?: boolean
}[] = [
  { name: "React", abbr: "React" },
  { name: "FastAPI", abbr: "API" },
  { name: "Python", abbr: "Py" },
  { name: "Claude AI", abbr: "AI", highlighted: true },
  { name: "MySQL", abbr: "SQL" },
  { name: "Tailwind", abbr: "TW" },
  { name: "Reddit API", abbr: "R" },
  { name: "YouTube", abbr: "YT" },
  { name: "Guardian", abbr: "G" },
  { name: "NewsAPI", abbr: "N" },
]

export const socialProofCards = [
  {
    emoji: "📚",
    title: "Academic Research",
    description:
      "Built as part of GUNI-SSRIP 2026 internship program at Conestoga College, Waterloo, Ontario.",
  },
  {
    emoji: "🔬",
    title: "Novel Features",
    description:
      "12 research-focused features including AI debate detection, trend prediction, and multi-source fusion.",
  },
  {
    emoji: "🌐",
    title: "Real Data Only",
    description:
      "Zero mock data in production. All results come from live APIs with real timestamps and real source links.",
  },
]

export const pricingPlans = [
  {
    name: "Free Local Demo",
    price: "$0",
    description: "Run OpinionPulse locally with live API integrations.",
    features: ["10 data sources", "AI summaries", "Local development"],
    highlighted: false,
  },
  {
    name: "Student Project",
    price: "Academic",
    description: "Built for final-year coursework and portfolio showcases.",
    features: ["Full feature prototype", "Research-ready UI", "Documentation friendly"],
    highlighted: true,
  },
  {
    name: "Future SaaS Plan",
    price: "Coming soon",
    description: "Planned subscription tiers for teams and businesses.",
    features: ["Multi-user workspaces", "Advanced alerts", "Enterprise reports"],
    highlighted: false,
  },
]

/** @deprecated Legacy sections — kept for unused preview components */
export const problemCards = [
  {
    title: "Too many opinions to read",
    description: "Thousands of comments across platforms make manual review overwhelming.",
    icon: MessagesSquare,
  },
  {
    title: "Hard to detect negative sentiment early",
    description: "Critical backlash often spreads before teams notice emerging risks.",
    icon: AlertTriangle,
  },
  {
    title: "No single dashboard for all sources",
    description: "Insights stay scattered, making comparison difficult.",
    icon: BarChart3,
  },
]

export const solutionCards = [
  {
    title: "Collect public data",
    description: "Gather discussions from Reddit, YouTube, and news into one pipeline.",
    icon: Database,
  },
  {
    title: "Analyze sentiment",
    description: "Classify opinions as positive, negative, or neutral using NLP.",
    icon: Sparkles,
  },
  {
    title: "Detect trending topics",
    description: "Surface rising keywords and conversation themes automatically.",
    icon: TrendingUp,
  },
  {
    title: "Ask AI questions",
    description: "Query Claude for summaries, comparisons, and actionable insights.",
    icon: Bot,
  },
]

export const chatbotMock = {
  userMessage: "What are people saying about AI regulation?",
  assistantMessage:
    "Opinions are divided. Supporters cite innovation benefits; critics emphasize safety and job impacts.",
}

export const dashboardStats = {
  totalMentions: "12,450",
  positive: "42%",
  neutral: "27%",
  negative: "31%",
  topComplaint: "Pricing",
  topSource: "Reddit",
}

export const sentimentChartData = [
  { date: "Mon", positive: 38, neutral: 30, negative: 32 },
  { date: "Tue", positive: 40, neutral: 28, negative: 32 },
  { date: "Wed", positive: 35, neutral: 29, negative: 36 },
  { date: "Thu", positive: 42, neutral: 27, negative: 31 },
  { date: "Fri", positive: 44, neutral: 26, negative: 30 },
  { date: "Sat", positive: 41, neutral: 28, negative: 31 },
  { date: "Sun", positive: 42, neutral: 27, negative: 31 },
]

export const techStack: {
  name: string
  description: string
  icon: LucideIcon
}[] = [
  { name: "React + Vite", description: "Modern frontend", icon: Globe },
  { name: "FastAPI", description: "Python API", icon: Server },
  { name: "MySQL", description: "Data storage", icon: Database },
  { name: "Claude AI", description: "AI analysis", icon: Sparkles },
  { name: "Reddit API", description: "Discussions", icon: Search },
  { name: "YouTube API", description: "Video comments", icon: Video },
  { name: "NewsAPI", description: "Headlines", icon: Newspaper },
]

export const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Demo", href: "#demo" },
    { label: "Tech Stack", href: "#tech-stack" },
    { label: "Pricing", href: "/pricing" },
  ],
  sources: [
    { label: "Reddit", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "The Guardian", href: "#" },
    { label: "NewsAPI", href: "#" },
    { label: "Hacker News", href: "#" },
    { label: "Dev.to", href: "#" },
  ],
  connect: [
    { label: "GitHub", href: "https://github.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Email", href: "mailto:hello@opinionpulse.io" },
  ],
}

export const heroPreviewStats = [
  { label: "Positive", value: 42, color: "bg-green-400" },
  { label: "Neutral", value: 27, color: "bg-gray-400" },
  { label: "Negative", value: 31, color: "bg-red-400" },
]
