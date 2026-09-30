"""Generate OpinionPulse 8-Week Project Review Report as PDF."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

OUT_PATH = Path(__file__).resolve().parent / "OpinionPulse-8-Week-Project-Review.pdf"


class ReviewPDF(FPDF):
    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "OpinionPulse - 8-Week Project Review Report", align="C")
        self.ln(4)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def section_title(self, title: str) -> None:
        self.ln(4)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(30, 58, 47)
        self.multi_cell(0, 7, title)
        self.ln(2)

    def sub_title(self, title: str) -> None:
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(45, 45, 45)
        self.multi_cell(0, 6, title)
        self.ln(1)

    def body(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        self.set_text_color(35, 35, 35)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        self.set_text_color(35, 35, 35)
        self.multi_cell(0, 5.5, f"  -  {text}")
        self.ln(0.5)


def build_pdf() -> None:
    pdf = ReviewPDF()
    pdf.set_margins(20, 20, 20)
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    def cover_line(text: str, h: float = 6) -> None:
        pdf.cell(0, h, text, ln=True, align="C")

    # Cover
    pdf.ln(28)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(30, 58, 47)
    cover_line("OpinionPulse", 10)
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 16)
    cover_line("8-Week Project Review Report", 8)
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    cover_line("AI-Powered Public Opinion Tracking Platform")
    pdf.ln(12)
    pdf.set_font("Helvetica", "", 10)
    cover_line("Reporting period: June 25, 2026 - August 20, 2026")
    cover_line("Branch: Dev")
    cover_line("Prepared for: Final-year project milestone review")
    pdf.ln(6)
    cover_line("Team: Shefil Khan, Khush Patel")
    cover_line("Faculty: Prof. Kiran Kamlesh Panchal")
    cover_line("Institute: Conestoga College, Kitchener, Ontario, Canada")

    pdf.add_page()
    pdf.section_title("Executive Summary")
    pdf.body(
        "Over the past eight weeks, OpinionPulse evolved from a functional multi-source sentiment "
        "platform into a demo-ready SaaS product with enterprise-grade modules: Crisis Radar, Pulse AI, "
        "Brand Monitoring, Stripe billing, and redesigned analytics across Search, Compare, Dashboard, "
        "and Chat."
    )
    pdf.body(
        "The work followed a clear arc: foundation and polish (Weeks 1-2), major feature expansion "
        "(Weeks 3-4), search and AI depth (Weeks 5-6), and reliability plus intelligence UI redesigns "
        "(Weeks 7-8). The platform integrates 13 live data sources, JWT and Google OAuth, 45+ backend "
        "tests, and a cohesive editorial design system."
    )

    pdf.section_title("Project Snapshot (End of Week 8)")
    snapshot = [
        ("Core search", "Parallel multi-platform search with filters, Wikipedia context, topic summaries"),
        ("Pulse AI", "Cited answers, research briefs, structured cards; router/orchestrator architecture"),
        ("Crisis Radar", "Volume/velocity matrix, narratives, market charts, Quiver Quant alt-data"),
        ("Compare", "Side-by-side analytics, scoring, verdict, collapsible factual context"),
        ("Dashboard", "Live debates, trending topics, intelligence layout"),
        ("Monetization", "Stripe checkout, plan tiers, usage limits"),
        ("Quality", "Pytest suite, source health API, rate-limit mitigation"),
        ("Frontend", "React 19, Vite, TypeScript, Tailwind v4, light/dark themes"),
    ]
    for area, status in snapshot:
        pdf.bullet(f"{area}: {status}")

    weeks = [
        {
            "title": "Week 1 - June 25 - July 1, 2026",
            "theme": "Documentation, Dashboard Polish & Academic Deliverables",
            "objectives": "Stabilize presentation quality and support final-year documentation requirements.",
            "deliverables": [
                "Dashboard UX improvements - enhanced chart tooltips and readability.",
                "SSRIP documentation generators for structured academic submission.",
                "Baseline platform maturity - core stack operational (FastAPI, React, 13-source search, auth, Compare).",
            ],
            "outcomes": [
                "Improved demo readability for supervisors and evaluators.",
                "Documentation pipeline established for ongoing project reporting.",
            ],
        },
        {
            "title": "Week 2 - July 2 - July 8, 2026",
            "theme": "Risk Intelligence, Conversion Funnel & Lead Capture",
            "objectives": "Extend AI capabilities beyond sentiment and improve go-to-market surfaces.",
            "deliverables": [
                "Social media risk analysis module with structured AI outputs.",
                "Search filter reliability fix after posted_at validation failures.",
                "Plan checkout page with platform logo marquee.",
                "Newsletter signup with welcome and admin notification emails.",
            ],
            "outcomes": [
                "OpinionPulse moved from sentiment tracker toward intelligence platform.",
                "Marketing funnel strengthened with checkout and newsletter paths.",
            ],
        },
        {
            "title": "Week 3 - July 9 - July 15, 2026",
            "theme": "Crisis Radar Launch & Brand Presence",
            "objectives": "Ship the flagship differentiator - real-time crisis monitoring with market context.",
            "deliverables": [
                "Crisis Radar backend - Quiver Quant API, market price endpoints.",
                "Crisis Radar frontend - matrix view, narratives, spread timeline, market charts.",
                "Landing page refresh - mobile navigation drawer, README branding assets.",
                "Updated project documentation with feature matrix and tech stack.",
            ],
            "outcomes": [
                "Crisis Radar became the primary demo narrative.",
                "Public-facing brand identity aligned with in-app editorial design.",
            ],
        },
        {
            "title": "Week 4 - July 16 - July 22, 2026",
            "theme": "SaaS Maturity - Billing, Auth, Audit & Test Coverage",
            "objectives": "Make the product subscription-ready and production-auditable.",
            "deliverables": [
                "Stripe embedded checkout and subscription management UI.",
                "Google OAuth stabilization and session switching fixes.",
                "Profile menu, notifications, and account settings refactor.",
                "Daily trending snapshots from live news feeds on Dashboard.",
                "Search accuracy pass with stricter relevance and recency scoring.",
                "Pulse AI structured message rendering enhancements.",
                "Full codebase audit and merge of fix/full-audit-and-repair branch.",
                "45 pytest tests covering logic, services, and API endpoints.",
            ],
            "outcomes": [
                "OpinionPulse qualified as a credible SaaS prototype with monetization path.",
                "Test coverage provided regression safety for rapid iteration.",
            ],
        },
        {
            "title": "Week 5 - July 23 - July 29, 2026",
            "theme": "Search Pipeline Hardening & Brand Monitoring",
            "objectives": "Improve data quality, source diversity, and monitoring workflows.",
            "deliverables": [
                "Query disambiguation and Wikipedia summaries on search responses.",
                "Pulse AI citations - research briefs, source cards, inline citations.",
                "Brand Monitor - watchlists, spike alerts, weekly reputation reports.",
                "Dashboard performance - tighter live feed fetching and topic table refresh.",
                "Search pipeline overhaul: time filtering, spam filters, YouTube comments.",
                "Language filter in API and UI; source status and filter statistics.",
            ],
            "outcomes": [
                "Search results became significantly more relevant and explainable.",
                "Brand monitoring connected search intelligence to proactive alerting.",
            ],
        },
        {
            "title": "Week 6 - July 30 - August 5, 2026",
            "theme": "Pulse AI Redesign, Topic Summaries & Compare Intelligence",
            "objectives": "Elevate the AI chat experience and add contextual summaries.",
            "deliverables": [
                "Pulse AI UI redesign with high-contrast design system and theme fixes.",
                "Search reliability - infinite loading prevention, stale request abortion, Windows fixes.",
                "504 timeout mitigation via per-source fetch budget caps.",
                "Topic Summary on Search - Wikipedia context plus OpinionPulse analytics.",
                "Compare page intelligence - summaries, comparison conclusion, Wikipedia links.",
                "Live share prices for Crisis Radar brand watches.",
                "Local dev start scripts and START guide.",
            ],
            "outcomes": [
                "Users could separate what a topic is (Wikipedia) from what people say (analytics).",
                "Compare page gained narrative conclusion logic alongside raw metrics.",
            ],
        },
        {
            "title": "Week 7 - August 6 - August 12, 2026",
            "theme": "Operational Reliability & Platform Health",
            "objectives": "Address production-like failures - empty dashboards, rate limits, source outages.",
            "deliverables": [
                "Live source health API for configured vs. live source status.",
                "Dashboard hang fix for empty-state deadlock.",
                "API token audit endpoint for third-party key verification.",
                "Reddit and GNews 429 rate limit mitigation; search timeout improvements.",
                "Live search repair across all configured platforms.",
                "Selective reverts of unstable features while preserving core functionality.",
            ],
            "outcomes": [
                "Platform became more resilient under real API constraints.",
                "Observability improved via source health and token audit tooling.",
            ],
        },
        {
            "title": "Week 8 - August 13 - August 20, 2026",
            "theme": "Intelligence UI Redesign & Pulse AI Architecture",
            "objectives": "Modernize analytics surfaces and advance Pulse AI toward agentic orchestration.",
            "deliverables": [
                "Crisis Radar visual redesign - monitoring console layout, new component library.",
                "Compare page redesign - scoreboard, verdict, tabs, compact topic cards.",
                "Topic Context accordions - restored Wikipedia background without oversized cards.",
                "Dashboard intelligence service and new intelligence layout.",
                "Pulse AI architecture - router, tools, evidence bundle, orchestrator, verifier.",
                "YouTube analytics service and Search intelligence view.",
                "Expanded test suite - crisis display, compare analytics, pulse router/evidence.",
            ],
            "outcomes": [
                "Factual context vs. analytics clearly separated in UI.",
                "Pulse AI moved toward routed, tool-using architecture.",
                "Frontend build passes; backend tests pass in project venv.",
            ],
        },
    ]

    for week in weeks:
        pdf.add_page()
        pdf.section_title(week["title"])
        pdf.sub_title(f"Theme: {week['theme']}")
        pdf.body(f"Objectives: {week['objectives']}")
        pdf.sub_title("Deliverables completed:")
        for item in week["deliverables"]:
            pdf.bullet(item)
        pdf.sub_title("Outcomes:")
        for item in week["outcomes"]:
            pdf.bullet(item)

    pdf.add_page()
    pdf.section_title("Cross-Cutting Achievements")
    pdf.sub_title("Architecture")
    for line in [
        "Monorepo: opinionpulse-frontend (React/Vite) + opinionpulse-backend (FastAPI).",
        "Data layer: MySQL via SQLAlchemy; JWT auth; APScheduler for background jobs.",
        "AI layer: Groq default; Anthropic optional; structured Pydantic outputs.",
    ]:
        pdf.bullet(line)

    pdf.sub_title("Design system")
    for line in [
        "Editorial/glassmorphic landing unified with in-app dashboard tokens.",
        "Light/dark theme via CSS custom properties.",
        "Consistent section labels and cards across Crisis, Compare, Dashboard, Search.",
    ]:
        pdf.bullet(line)

    pdf.sub_title("Quality & DevOps")
    for line in [
        "45+ pytest tests at Week 4 baseline; expanded to 19 test modules by Week 8.",
        "CI badge on README (Dev branch).",
        "Local dev guides and start scripts.",
    ]:
        pdf.bullet(line)

    pdf.section_title("Risks & Mitigations")
    risks = [
        ("Third-party API rate limits", "Per-source budgets, 429 handling, source health UI"),
        ("Windows async/event loop issues", "Platform-specific fixes in search pipeline"),
        ("Feature complexity vs. demo stability", "Rollback discipline; incremental merge strategy"),
        ("Uncommitted Week 8 changes", "Consolidate commit; tag release candidate"),
    ]
    for risk, mitigation in risks:
        pdf.bullet(f"{risk}: {mitigation}")

    pdf.section_title("Recommendations - Next 2 Weeks")
    for item in [
        "Commit and tag Week 8 redesign work (Crisis Radar, Compare, Dashboard intelligence, Pulse AI).",
        "End-to-end demo script - Compare topics, Crisis Radar brand watch, Pulse AI cited answer.",
        "Load testing under Starter plan limits.",
        "Restore PROJECT_OVERVIEW.md with current architecture diagram.",
        "Complete Pulse AI orchestrator tool selection for agentic flows.",
    ]:
        pdf.bullet(item)

    pdf.section_title("Conclusion")
    pdf.body(
        "The eight-week period transformed OpinionPulse from a capable sentiment search tool into a "
        "multi-module intelligence platform suitable for final-year demonstration and stakeholder review. "
        "Core strengths entering the evaluation phase are breadth (13-source live search with Wikipedia "
        "grounding), depth (Crisis Radar, Compare analytics, Brand Monitor, Pulse AI), commercial "
        "readiness (Stripe billing, plan tiers, OAuth), and engineering discipline (audit pass, expanding "
        "test suite, health monitoring). The project is on track for a strong final presentation."
    )

    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        0,
        5,
        "Report generated from git history (Dev branch, Jun 25 - Aug 20, 2026), "
        "codebase inspection, and development session records.",
    )

    pdf.output(str(OUT_PATH))
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    build_pdf()
