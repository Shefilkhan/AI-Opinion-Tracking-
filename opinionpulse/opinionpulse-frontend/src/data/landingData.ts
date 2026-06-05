import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Brain,
  CheckCircle,
  Database,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Newspaper,
  Scale,
  Search,
  Server,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
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
  containerBg: string
  iconColor: string
}[] = [
  {
    title: "Search Across 10 Sources",
    description:
      "Reddit, YouTube, Guardian, NewsAPI, Hacker News, Dev.to and more — searched simultaneously in seconds.",
    icon: Search,
    containerBg: "bg-[#EDE9FE]",
    iconColor: "text-[#7C3AED]",
  },
  {
    title: "AI-Powered Analysis",
    description:
      "Groq-powered AI reads all results and generates a clear summary of what people actually think — and why.",
    icon: Brain,
    containerBg: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
  },
  {
    title: "Live Debate Detection",
    description:
      "Automatically identifies topics where opinions are sharply divided and presents both sides objectively.",
    icon: Scale,
    containerBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
  },
  {
    title: "Sentiment Trend Prediction",
    description:
      "AI analyzes momentum and predicts where public opinion is heading over the next 7 days.",
    icon: TrendingUp,
    containerBg: "bg-[#D1FAE5]",
    iconColor: "text-[#059669]",
  },
  {
    title: "Live Opinion Dashboard",
    description:
      "See trending debates, most discussed topics, and platform-by-platform sentiment — all updating live.",
    icon: LayoutDashboard,
    containerBg: "bg-[#FCE7F3]",
    iconColor: "text-[#DB2777]",
  },
  {
    title: "Keyword Alerts",
    description:
      "Get notified when sentiment on any topic shifts significantly — before it becomes mainstream news.",
    icon: Bell,
    containerBg: "bg-[#FEF9C3]",
    iconColor: "text-[#CA8A04]",
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
      "Groq AI analyzes sentiment, detects debates, and predicts where opinion is heading next.",
    emoji: "🤖",
  },
]

export const techStackItems: { name: string; dotColor: string }[] = [
  { name: "React", dotColor: "#61DAFB" },
  { name: "FastAPI", dotColor: "#009688" },
  { name: "Python", dotColor: "#3776AB" },
  { name: "Groq AI", dotColor: "#7C3AED" },
  { name: "MySQL", dotColor: "#4479A1" },
  { name: "Tailwind CSS", dotColor: "#06B6D4" },
  { name: "Reddit API", dotColor: "#FF4500" },
  { name: "YouTube API", dotColor: "#FF0000" },
  { name: "Guardian API", dotColor: "#052962" },
  { name: "NewsAPI", dotColor: "#2563EB" },
]

export const socialProofCards: {
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    title: "Academic Research",
    description:
      "Built as part of GUNI-SSRIP 2026 internship at Conestoga College, Waterloo, Ontario. Designed to meet academic research standards.",
    icon: GraduationCap,
  },
  {
    title: "Novel Features",
    description:
      "AI debate detection, trend prediction, and multi-source fusion — features not found in standard opinion tracking tools.",
    icon: Zap,
  },
  {
    title: "Real Data Only",
    description:
      "Zero mock data in production. All results come from live APIs with real timestamps, real authors, and real clickable source links.",
    icon: CheckCircle,
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
    { label: "GNews", href: "#" },
    { label: "Currents", href: "#" },
    { label: "Mediastack", href: "#" },
  ],
  connect: [
    {
      label: "GitHub",
      href: "https://github.com/Shefilkhan/AI-Opinion-Tracking-",
    },
    { label: "LinkedIn", href: "https://linkedin.com/in/shefilkhan" },
    { label: "Email", href: "mailto:shefilpathan@gmail.com" },
  ],
  project: [
    "GUNI-SSRIP 2026",
    "Conestoga College",
    "Waterloo, Ontario",
    "Academic Research",
  ],
}

export const heroPreviewStats = [
  { label: "Positive", value: 42, color: "bg-green-400" },
  { label: "Neutral", value: 27, color: "bg-gray-400" },
  { label: "Negative", value: 31, color: "bg-red-400" },
]
