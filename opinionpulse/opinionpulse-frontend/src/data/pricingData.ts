export type PlanId = "starter" | "pro" | "enterprise"

export const planPrices: Record<
  PlanId,
  { monthly: number; annual: number; annualTotal: number }
> = {
  starter: { monthly: 9, annual: 7, annualTotal: 84 },
  pro: { monthly: 29, annual: 23, annualTotal: 276 },
  enterprise: { monthly: 99, annual: 79, annualTotal: 948 },
}

export type PlanFeature = {
  text: string
  included: boolean
}

export type PricingPlan = {
  id: PlanId
  name: string
  tagline: string
  badge?: string
  badgePosition?: "top" | "corner"
  features: PlanFeature[]
  cta: string
  ctaVariant: "outline" | "gradient" | "dark"
  ctaHref?: string
  ctaMailto?: boolean
  footnote?: string
  highlighted?: boolean
  orderMobile?: number
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Perfect for individuals and researchers",
    features: [
      { text: "Up to 100 searches/month", included: true },
      { text: "5 data sources (Reddit, HN, Dev.to, NewsAPI, Guardian)", included: true },
      { text: "Basic sentiment analysis", included: true },
      { text: "7-day search history", included: true },
      { text: "Wikipedia summary cards", included: true },
      { text: "CSV export (up to 100 rows)", included: true },
      { text: "Email support", included: true },
      { text: "AI Opinion Summary", included: false },
      { text: "AI Debate Analysis", included: false },
      { text: "AI Trend Prediction", included: false },
      { text: "Real-time alerts", included: false },
    ],
    cta: "Get Started",
    ctaVariant: "outline",
    orderMobile: 2,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For power users, analysts, and content creators",
    badge: "✨ Most Popular",
    badgePosition: "top",
    highlighted: true,
    features: [
      { text: "Unlimited searches", included: true },
      { text: "All 10 data sources", included: true },
      { text: "Advanced sentiment analysis", included: true },
      { text: "30-day search history", included: true },
      { text: "Wikipedia summary cards", included: true },
      { text: "Unlimited CSV export", included: true },
      { text: "🤖 AI Opinion Summary", included: true },
      { text: "🤖 AI Debate Analysis", included: true },
      { text: "🤖 AI Trend Prediction", included: true },
      { text: "Real-time keyword alerts (up to 5)", included: true },
      { text: "Priority email support", included: true },
      { text: "Custom API integrations", included: false },
      { text: "Team workspace", included: false },
      { text: "White-label reports", included: false },
    ],
    cta: "Start Pro Trial →",
    ctaVariant: "gradient",
    footnote: "14-day free trial · No credit card required",
    orderMobile: 1,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For organizations, universities, and research teams",
    badge: "For Teams",
    badgePosition: "corner",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 10 team members", included: true },
      { text: "Unlimited keyword alerts", included: true },
      { text: "Custom API integrations", included: true },
      { text: "White-label PDF reports", included: true },
      { text: "Dedicated Slack support channel", included: true },
      { text: "Custom data retention (up to 1 year)", included: true },
      { text: "SSO / SAML login", included: true },
      { text: "SLA guarantee (99.9% uptime)", included: true },
      { text: "Onboarding call included", included: true },
      { text: "Custom sentiment models", included: true },
      { text: "API access (REST)", included: true },
    ],
    cta: "Contact Sales →",
    ctaVariant: "dark",
    ctaMailto: true,
    footnote: "or start with a 14-day free trial",
    orderMobile: 3,
  },
]

export type ComparisonCell = string | boolean

export type ComparisonRow = {
  category?: string
  feature: string
  starter: ComparisonCell
  pro: ComparisonCell
  enterprise: ComparisonCell
}

export const comparisonRows: ComparisonRow[] = [
  { category: "SEARCH & DATA", feature: "", starter: "", pro: "", enterprise: "" },
  { feature: "Monthly searches", starter: "100", pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "Data sources", starter: "5", pro: "10", enterprise: "10+custom" },
  { feature: "Search history", starter: "7 days", pro: "30 days", enterprise: "1 year" },
  { feature: "Real-time data", starter: true, pro: true, enterprise: true },

  { category: "AI FEATURES", feature: "", starter: "", pro: "", enterprise: "" },
  { feature: "AI Opinion Summary", starter: false, pro: true, enterprise: true },
  { feature: "AI Debate Analysis", starter: false, pro: true, enterprise: true },
  { feature: "AI Trend Prediction", starter: false, pro: true, enterprise: true },
  { feature: "Custom AI models", starter: false, pro: false, enterprise: true },

  { category: "ALERTS & REPORTS", feature: "", starter: "", pro: "", enterprise: "" },
  { feature: "Keyword alerts", starter: false, pro: "5", enterprise: "Unlimited" },
  { feature: "Email reports", starter: false, pro: "Weekly", enterprise: "Daily" },
  { feature: "CSV export", starter: "100 rows", pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "PDF reports", starter: false, pro: false, enterprise: true },
  { feature: "White-label reports", starter: false, pro: false, enterprise: true },

  { category: "TEAM & ACCESS", feature: "", starter: "", pro: "", enterprise: "" },
  { feature: "Team members", starter: "1", pro: "1", enterprise: "10" },
  { feature: "API access", starter: false, pro: false, enterprise: true },
  { feature: "SSO / SAML", starter: false, pro: false, enterprise: true },

  { category: "SUPPORT", feature: "", starter: "", pro: "", enterprise: "" },
  { feature: "Email support", starter: true, pro: "Priority", enterprise: "Dedicated" },
  { feature: "Slack channel", starter: false, pro: false, enterprise: true },
  { feature: "Onboarding call", starter: false, pro: false, enterprise: true },
  { feature: "SLA guarantee", starter: false, pro: false, enterprise: "99.9%" },
]

export const pricingFaqs = [
  {
    q: "Is there really a 14-day free trial?",
    a: "Yes — no credit card required. You get full Pro access for 14 days. If you don't love it, just cancel.",
  },
  {
    q: "What happens when I hit my search limit on Starter?",
    a: "You'll see a notification when you reach 80% of your limit. At 100%, searches pause until next month or you upgrade to Pro — whichever comes first.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel from your account settings with one click. No cancellation fees, no questions asked. Your data is kept for 30 days after cancellation.",
  },
  {
    q: "Do the AI features use my data to train models?",
    a: "No. Your searches and results are never used to train AI models. Claude API processes requests in real-time without storing your data.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal. Annual plans can be paid by bank transfer — contact sales for details.",
  },
  {
    q: "Do you offer student or academic discounts?",
    a: "Yes! Students and researchers get 50% off any plan. Email us with your .edu address or institution letter for the discount code.",
  },
]

export const trustBadges = [
  { emoji: "🔒", label: "SSL Encrypted" },
  { emoji: "💳", label: "Secure Payments via Stripe" },
  { emoji: "🔄", label: "Cancel Anytime" },
  { emoji: "🎓", label: "Student Discounts Available" },
]

export const ENTERPRISE_EMAIL =
  "mailto:shefilpathan@gmail.com?subject=OpinionPulse%20Enterprise%20Inquiry"
