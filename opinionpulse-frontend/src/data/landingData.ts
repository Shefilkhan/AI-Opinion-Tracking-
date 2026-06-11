import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Database,
  FileText,
  Globe,
  Hash,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  Radio,
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
  { label: "Pricing", href: "#pricing" },
] as const

export const problemCards: {
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    title: "Too many opinions to read",
    description:
      "Thousands of comments across Reddit threads, YouTube videos, and news articles make manual review slow and overwhelming.",
    icon: MessagesSquare,
  },
  {
    title: "Hard to detect negative sentiment early",
    description:
      "Critical backlash often spreads before teams notice recurring complaints or emerging risks.",
    icon: AlertTriangle,
  },
  {
    title: "No single dashboard for all sources",
    description:
      "Insights stay scattered across platforms, making it difficult to compare sentiment in one place.",
    icon: BarChart3,
  },
]

export const solutionCards: {
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    title: "Collect public data",
    description:
      "Gather discussions from Reddit, YouTube comments, and GDELT news/media into one pipeline.",
    icon: Database,
  },
  {
    title: "Analyze sentiment",
    description:
      "Classify opinions as positive, negative, or neutral using NLP and ML models.",
    icon: Sparkles,
  },
  {
    title: "Detect trending topics",
    description:
      "Surface rising keywords, complaints, and conversation themes automatically.",
    icon: TrendingUp,
  },
  {
    title: "Ask chatbot questions",
    description:
      "Query the AI Opinion Assistant for summaries, comparisons, and actionable insights.",
    icon: Bot,
  },
]

export const features: {
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    title: "Reddit opinion tracking",
    description: "Monitor subreddit discussions and thread sentiment by keyword.",
    icon: MessageSquare,
  },
  {
    title: "YouTube comment sentiment",
    description: "Analyze viewer reactions and comment tone on video content.",
    icon: Video,
  },
  {
    title: "GDELT news/media tracking",
    description: "Track global news narratives and media mentions at scale.",
    icon: Newspaper,
  },
  {
    title: "Sentiment detection",
    description: "Positive, negative, and neutral classification for every mention.",
    icon: Sparkles,
  },
  {
    title: "AI Opinion Assistant",
    description: "Ask natural-language questions about public opinion trends.",
    icon: Bot,
  },
  {
    title: "Mention feed",
    description: "Browse recent mentions with source, date, and sentiment labels.",
    icon: Radio,
  },
  {
    title: "Sentiment charts",
    description: "Visualize sentiment shifts over time with interactive charts.",
    icon: BarChart3,
  },
  {
    title: "Keyword tracking",
    description: "Follow brands, products, or topics across all connected sources.",
    icon: Hash,
  },
  {
    title: "Alerts",
    description: "Get notified when negative sentiment spikes or keywords trend.",
    icon: Bell,
  },
  {
    title: "Reports",
    description: "Export summaries for research, coursework, or stakeholder reviews.",
    icon: FileText,
  },
]

export const howItWorksSteps = [
  {
    step: 1,
    title: "Create a project",
    description: "Set up a tracking workspace for your brand, topic, or research question.",
  },
  {
    step: 2,
    title: "Add keywords",
    description: "Define the terms, products, or entities you want to monitor.",
  },
  {
    step: 3,
    title: "Select sources",
    description: "Choose Reddit, YouTube, GDELT news, or any combination.",
  },
  {
    step: 4,
    title: "Collect and analyze data",
    description: "OpinionPulse ingests public data and runs sentiment analysis automatically.",
  },
  {
    step: 5,
    title: "View dashboard and ask chatbot",
    description: "Explore charts, mentions, and chat with the AI Opinion Assistant.",
  },
]

export const chatbotMock = {
  userMessage: "What are people saying about Netflix pricing?",
  assistantMessage:
    "Most opinions are negative. Common complaints include price increases, account sharing limits, and reduced value compared to competitors.",
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

export const heroPreviewStats = [
  { label: "Positive", value: 42, color: "bg-emerald-500" },
  { label: "Neutral", value: 27, color: "bg-slate-500" },
  { label: "Negative", value: 31, color: "bg-rose-500" },
]

export const techStack: {
  name: string
  description: string
  icon: LucideIcon
}[] = [
  { name: "React + Vite", description: "Modern frontend with fast dev experience", icon: Globe },
  { name: "FastAPI", description: "Python API for data collection and NLP", icon: Server },
  { name: "XAMPP MySQL", description: "Relational storage for projects and mentions", icon: Database },
  { name: "Python NLP", description: "Sentiment analysis and text processing", icon: Sparkles },
  { name: "Reddit API", description: "Public discussion and thread monitoring", icon: MessageSquare },
  { name: "YouTube API", description: "Comment and engagement tracking", icon: Video },
  { name: "GDELT API", description: "Global news and media event data", icon: Newspaper },
]

export const pricingPlans = [
  {
    name: "Free Local Demo",
    price: "$0",
    description: "Run OpinionPulse locally with mock and sample data.",
    features: ["Landing page demo", "Mock dashboard", "Local development"],
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

export const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Demo", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
  ],
  resources: [
    { label: "Tech Stack", href: "#tech-stack" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Sign Up", href: "/signup" },
  ],
}
