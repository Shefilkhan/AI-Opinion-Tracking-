"""Generate SSRIP Review Report (DOCX) and Presentation (PPTX)."""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt

OUT_DIR = Path(__file__).resolve().parent

PROJECT = {
    "title": "OpinionPulse — AI-Powered Public Opinion Tracking Platform",
    "mentors": "Prof. Kiran Kamlesh Panchal, IOT, Ganpat University",
    "students": "Shefil Khan, Khush Patel",
    "faculty": "Prof. Kiran Kamlesh Panchal",
    "institute": "Conestoga College, Kitchener, Ontario, Canada",
    "start_date": "19th May 2026",
    "review_period": "25th June 2026 - 20th August 2026",
}

# Eight-week narrative reports (GUNI-SSRIP format — paragraph style per week)
WEEKS = [
    {
        "label": "Week 1 Report",
        "report": (
            "In the first week of this review period, we focused on polishing the dashboard experience "
            "and preparing academic deliverables for the SSRIP submission. We improved chart tooltips, "
            "axis labels, and text contrast across sentiment and activity visualizations so supervisors "
            "and evaluators could read results clearly during live demos. We also built SSRIP "
            "documentation generators and screenshot capture scripts to automate the review report and "
            "presentation workflow. By this point the core OpinionPulse stack was already operational — "
            "React frontend, FastAPI backend, MySQL database, JWT authentication, and multi-source "
            "search — which allowed the team to concentrate on presentation quality and documentation "
            "rather than greenfield setup. We verified that the Dev branch builds cleanly and that "
            "dashboard widgets load without hanging when live feeds are slow."
        ),
    },
    {
        "label": "Week 2 Report",
        "report": (
            "The second week extended OpinionPulse beyond basic sentiment tracking into risk intelligence "
            "and conversion-focused marketing surfaces. We implemented a social media risk analysis module "
            "that produces structured AI outputs for narrative risk scoring and assessment. We fixed a "
            "search regression where posted_at validation failures caused active platform and time-range "
            "filters to reset unexpectedly. On the frontend, we added a dedicated plan checkout page with "
            "a platform logo marquee to build user trust during signup. We also integrated newsletter "
            "signup with welcome emails for new subscribers and admin notification emails for lead "
            "tracking. These changes moved OpinionPulse closer to a credible SaaS product with both "
            "intelligence features and a clear path from landing page to paid plan."
        ),
    },
    {
        "label": "Week 3 Report",
        "report": (
            "This week we launched Crisis Radar — the flagship differentiator of OpinionPulse. On the "
            "backend, we integrated Quiver Quantitative API for alternative market intelligence "
            "(congressional trades, insider activity, 13F filings, and lobbying data) and added live "
            "stock and crypto price endpoints for brand watches. On the frontend, we built the Crisis "
            "Radar page with a volume-and-velocity matrix, narrative cluster cards, spread timeline, "
            "market price charts, and a Quiver intelligence panel. We also refreshed the public landing "
            "page with a redesigned mobile navigation drawer and updated README branding assets including "
            "hero imagery and feature badges. By the end of this week, Crisis Radar became the primary "
            "demo narrative: detecting narrative risk and public attention spikes before they affect "
            "markets or brand reputation."
        ),
    },
    {
        "label": "Week 4 Report",
        "report": (
            "In the fourth week we made the platform subscription-ready and production-auditable. We "
            "integrated Stripe embedded checkout and built subscription management in account settings. "
            "Google OAuth login was stabilized with fixes for session switching and invalid client "
            "configuration edge cases. We refactored the profile menu, notifications panel, and account "
            "settings into a cleaner structure. The dashboard gained daily trending snapshots sourced "
            "from live news feeds. Search accuracy was improved with stricter relevance and recency "
            "scoring. Pulse AI responses were enhanced with structured message rendering for richer "
            "chat output. We conducted a full codebase audit, merged the fix/full-audit-and-repair "
            "branch, and expanded automated testing to 45 pytest cases covering logic, services, and "
            "API endpoints. This week established regression safety for the rapid feature work planned "
            "in the following weeks."
        ),
    },
    {
        "label": "Week 5 Report",
        "report": (
            "The fifth week was dedicated to search pipeline hardening and proactive brand monitoring. "
            "We improved query disambiguation, relevance scoring, and Wikipedia summary fetching so every "
            "search response could include factual topic context alongside live mentions. Pulse AI was "
            "upgraded with cited answers, research briefs, and source cards so chat responses reference "
            "real retrieved data. We built the Brand Monitor module with watchlists, spike alerts, and "
            "weekly reputation reports. Dashboard performance was tuned by tightening live feed fetch "
            "intervals and topic table refresh logic. The search pipeline received a major overhaul: "
            "per-platform time filtering, brand disambiguation, marketplace spam filters, YouTube video "
            "comments in results, improved multi-source fetch diversity, language filter support in the "
            "API and UI, and source status indicators with filter statistics. All 13 integrated platforms "
            "remained active: Reddit, YouTube, Hacker News, Dev.to, NewsAPI, Guardian, Bluesky, "
            "Mastodon, GitHub, Stack Overflow, Wikipedia, GNews, and Currents."
        ),
    },
    {
        "label": "Week 6 Report",
        "report": (
            "This week we elevated the Pulse AI chat experience and added contextual summaries across "
            "Search and Compare. We completed a full Pulse AI UI redesign with a high-contrast design "
            "system, fixed layout bugs, and resolved light/dark theme text contrast issues in discussion "
            "theme cards and snapshot tables. Search reliability was a major focus: we prevented infinite "
            "loading when backends or individual sources hang, added stale request abortion and health "
            "checks, fixed Windows event loop mismatches for async fetchers, and capped per-source fetch "
            "budgets to eliminate 504 gateway timeouts. We introduced Topic Summary on the Search page "
            "combining Wikipedia context with OpinionPulse analytics via topic_summary_service. The Compare "
            "page gained topic summaries, a deterministic comparison conclusion, and Wikipedia source "
            "links. Crisis Radar received live share prices for brand watches. We also added local dev "
            "start scripts and a START guide to help teammates run search and chat modules consistently."
        ),
    },
    {
        "label": "Week 7 Report",
        "report": (
            "The seventh week focused on operational reliability under real API constraints. We added a "
            "live source health API exposing which platforms are configured versus currently reachable, "
            "and fixed a dashboard hang that occurred when live data was unavailable in empty states. "
            "An API token audit endpoint was added so developers can verify which third-party keys are "
            "properly configured without exposing secret values. We mitigated Reddit and GNews 429 rate "
            "limit errors and improved search timeout handling so partial results return gracefully "
            "instead of failing entirely. Live search was repaired to ensure all configured platforms "
            "participate in parallel queries. Some features introduced earlier in the week were selectively "
            "reverted after integration testing exposed edge cases, following a disciplined rollback "
            "approach that preserved demo stability while keeping core Crisis Radar, Compare, and Search "
            "functionality intact."
        ),
    },
    {
        "label": "Week 8 Report",
        "report": (
            "The final week focused on intelligence UI redesign and advancing Pulse AI toward agentic "
            "orchestration. Crisis Radar was rebuilt as a premium monitoring console with new components "
            "including attention summary, brand watch list, selected watch panel, signal history chart, "
            "recommended actions, and Ask Pulse AI deep links via URL prompts. The Compare page was "
            "redesigned with a comparison scoreboard, verdict panel, tabbed analytics (Overview, "
            "Sentiment, Platforms, Themes, Trends, Sources), and compact topic identity cards. Factual "
            "topic context and Wikipedia links were restored in collapsible About panels without "
            "returning to the previous oversized summary layout. Dashboard intelligence received a new "
            "backend service and frontend layout. Pulse AI architecture was extended with router, tools, "
            "evidence bundle, orchestrator, and verifier services, with optional xAI integration and "
            "Deep/Live mode wiring. YouTube analytics and search intelligence views were added. The test "
            "suite was expanded with crisis display mapping, compare analytics, pulse router, and evidence "
            "service tests. Frontend production build passes and the platform is ready for final demo "
            "and evaluation."
        ),
    },
]

FUTURE_WORK = (
    "In the future, we plan to deploy OpinionPulse to cloud hosting (AWS or Azure) with production "
    "MySQL, HTTPS, and a CI/CD pipeline. Stripe billing is already integrated; we will extend automated "
    "Enterprise tier provisioning and usage analytics. Pulse AI will be completed as a fully agentic "
    "system with dynamic tool selection and verified citations. Sentiment accuracy will be improved "
    "with LLM-based analysis for nuanced topics. We plan email and push alert notifications when "
    "Crisis Radar or Brand Monitor thresholds are crossed, a mobile-responsive PWA, multi-language "
    "support, and a public REST API for third-party research integrations."
)

CHALLENGES = (
    "Managing rate limits across many free news and social APIs required per-source fetch budgets, "
    "429 handling, and a live source health dashboard. Windows async event loop mismatches caused "
    "intermittent source fetch failures that required platform-specific fixes. Google OAuth and Gmail "
    "SMTP setup needed careful .env configuration for each teammate's local environment. Feature "
    "velocity occasionally required selective reverts to maintain demo stability. Support needed: "
    "stable cloud hosting credits and Groq/Anthropic API budget for demo presentations and production "
    "deployment."
)

COMMENTS = (
    "Students demonstrated strong full-stack progress — from a working multi-source search platform "
    "to a full intelligence suite with Crisis Radar, Compare analytics, Brand Monitor, and Pulse AI "
    "in eight weeks. Recommend demonstrating live search, Crisis Radar brand watches, Compare Topics "
    "with topic context panels, and Pulse AI cited answers during the final evaluation. Continue "
    "consolidating uncommitted Week 8 redesign work into tagged releases and expanding automated tests "
    "before production deployment."
)

SIGNATURES = [
    ("Name & Sign of Mentor:", "Prof. Kiran Panchal,\nIOT-IT,\nGanpat University"),
    ("Name & Sign of Co-Mentor:", "-"),
    (
        "Name & Sign of Associate Dean (Research)",
        "Prof. (Dr.) Bhavesh Thakar,\nFODE - H&S Department,\nGanpat University",
    ),
    (
        "Name & Sign of Dean / Principal",
        "Prof. (Dr.) K.P. Patel, Principal\nand Executive Dean FODE,\nGanpat University",
    ),
]


def build_docx() -> Path:
    """Build GUNI-SSRIP Review Report matching the official PDF format."""
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(
        "GUNI Summer Student Research Internship Program\n(GUNI-SSRIP 2026)\nReview Report"
    )
    run.bold = True
    run.font.size = Pt(14)

    doc.add_paragraph()

    fields = [
        ("Project Title:", PROJECT["title"]),
        ("Project Mentor(s):", PROJECT["mentors"]),
        ("Name of Student:", PROJECT["students"]),
        ("Faculty Name:", PROJECT["faculty"]),
        ("Institute Name / Address:", PROJECT["institute"]),
        ("Start Date of SSRP Project:", PROJECT["start_date"]),
        ("Review Period (Date):", PROJECT["review_period"]),
    ]

    for label, value in fields:
        p = doc.add_paragraph()
        p.add_run(f"{label} ").bold = True
        p.add_run(value)

    doc.add_paragraph()
    h = doc.add_paragraph()
    h.add_run(
        "Details of Work done (Weekly) (Please attach detailed report if necessary):"
    ).bold = True

    for week in WEEKS:
        doc.add_paragraph()
        wp = doc.add_paragraph()
        wp.add_run(f"{week['label']}: ").bold = True
        wp.add_run(week["report"])

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run("Future Work Plan: ").bold = True
    doc.add_paragraph(FUTURE_WORK)

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run("Comments given by Expert / Suggestion:").bold = True
    doc.add_paragraph(COMMENTS)

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run("Challenges / Support Required: ").bold = True
    doc.add_paragraph(CHALLENGES)

    doc.add_paragraph()
    for label, value in SIGNATURES:
        p = doc.add_paragraph()
        p.add_run(label).bold = True
        if value and value != "-":
            doc.add_paragraph(value)
        elif value == "-":
            doc.add_paragraph("-")

    path = OUT_DIR / "OpinionPulse_SSRIP_Review_Report.docx"
    doc.save(path)
    return path


def build_docx_copy(dest: Path | None = None) -> Path:
    """Build report and optionally copy to another location."""
    path = build_docx()
    if dest is not None:
        import shutil

        shutil.copy2(path, dest)
    return path


SCREENSHOTS_DIR = OUT_DIR / "screenshots"


def _screenshot(name: str) -> Path | None:
    path = SCREENSHOTS_DIR / f"{name}.png"
    return path if path.is_file() else None


def build_pptx() -> Path:
    """Build a project-focused SSRIP presentation with detailed explanations."""
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.util import Inches, Pt as PptPt

    class C:
        FOREST = RGBColor(0x1B, 0x4D, 0x3E)
        FOREST_DARK = RGBColor(0x12, 0x35, 0x2B)
        CREAM = RGBColor(0xF7, 0xF5, 0xF0)
        WHITE = RGBColor(0xFF, 0xFF, 0xFF)
        TEXT = RGBColor(0x1A, 0x1F, 0x1C)
        MUTED = RGBColor(0x6B, 0x72, 0x6B)
        ACCENT = RGBColor(0xC4, 0x7A, 0x4A)
        LINE = RGBColor(0xD8, 0xD3, 0xCB)

    FONT = "Calibri"
    W = Inches(13.333)
    H = Inches(7.5)
    FOOTER = "OpinionPulse  ·  GUNI SSRIP 2026  ·  Project Presentation"

    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]
    slide_num = [0]

    def _fill(shape, color: RGBColor) -> None:
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
        shape.line.fill.background()

    def _textbox(
        slide,
        left,
        top,
        width,
        height,
        text: str,
        *,
        size: int = 18,
        bold: bool = False,
        color: RGBColor = C.TEXT,
        align=PP_ALIGN.LEFT,
    ):
        box = slide.shapes.add_textbox(left, top, width, height)
        tf = box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.alignment = align
        p.font.name = FONT
        p.font.size = PptPt(size)
        p.font.bold = bold
        p.font.color.rgb = color
        return box

    def _footer(slide) -> None:
        _textbox(
            slide,
            Inches(0.6),
            H - Inches(0.45),
            W - Inches(1.2),
            Inches(0.3),
            f"{FOOTER}  ·  Slide {slide_num[0]}",
            size=9,
            color=C.MUTED,
            align=PP_ALIGN.RIGHT,
        )

    def _slide_bg(slide, color: RGBColor = C.CREAM) -> None:
        bg = slide.shapes.add_shape(1, 0, 0, W, H)
        _fill(bg, color)
        slide.shapes._spTree.remove(bg._element)
        slide.shapes._spTree.insert(2, bg._element)

    def _header_bar(slide, title: str, subtitle: str = "") -> None:
        bar = slide.shapes.add_shape(1, 0, 0, W, Inches(1.05))
        _fill(bar, C.FOREST)
        accent = slide.shapes.add_shape(1, 0, Inches(1.05), W, Inches(0.06))
        _fill(accent, C.ACCENT)
        _textbox(slide, Inches(0.65), Inches(0.22), Inches(11.5), Inches(0.55), title, size=28, bold=True, color=C.WHITE)
        if subtitle:
            _textbox(slide, Inches(0.65), Inches(0.72), Inches(11.5), Inches(0.35), subtitle, size=13, color=RGBColor(0xC8, 0xD9, 0xD2))

    def _left_accent(slide) -> None:
        stripe = slide.shapes.add_shape(1, 0, Inches(1.11), Inches(0.12), H - Inches(1.11))
        _fill(stripe, C.FOREST)

    def _bullets(
        slide,
        items: list[str],
        *,
        top=Inches(1.45),
        left=Inches(0.85),
        width=None,
        size: int = 15,
        gap: float = 0.52,
    ) -> None:
        text_width = width or (W - left - Inches(0.9))
        y = top
        for item in items:
            dot = slide.shapes.add_shape(1, left, y + Inches(0.07), Inches(0.1), Inches(0.1))
            _fill(dot, C.ACCENT)
            _textbox(slide, left + Inches(0.24), y, text_width, Inches(0.85), item, size=size, color=C.TEXT)
            y += Inches(gap)

    def _paragraph_block(slide, text: str, *, top=Inches(1.45), left=Inches(0.85), width=Inches(11.8), size: int = 15) -> None:
        _textbox(slide, left, top, width, Inches(1.2), text, size=size, color=C.TEXT)

    def _new_content(title: str, subtitle: str = "") -> object:
        slide_num[0] += 1
        slide = prs.slides.add_slide(blank)
        _slide_bg(slide)
        _header_bar(slide, title, subtitle)
        _left_accent(slide)
        _footer(slide)
        return slide

    def _new_section(title: str, subtitle: str) -> None:
        slide_num[0] += 1
        slide = prs.slides.add_slide(blank)
        _slide_bg(slide, C.FOREST_DARK)
        bar = slide.shapes.add_shape(1, Inches(0.8), Inches(2.8), Inches(1.2), Inches(0.08))
        _fill(bar, C.ACCENT)
        _textbox(slide, Inches(0.8), Inches(3.0), Inches(11), Inches(0.9), title, size=36, bold=True, color=C.WHITE)
        _textbox(slide, Inches(0.8), Inches(3.85), Inches(11), Inches(0.6), subtitle, size=20, color=RGBColor(0xA8, 0xC4, 0xB8))
        _footer(slide)

    def _add_image(slide, img_path: Path | None, left, top, width) -> None:
        frame = slide.shapes.add_shape(1, left - Inches(0.08), top - Inches(0.08), width + Inches(0.16), width * 0.56 + Inches(0.16))
        _fill(frame, C.WHITE)
        frame.line.color.rgb = C.LINE
        if img_path:
            slide.shapes.add_picture(str(img_path), left, top, width=width)
        else:
            _textbox(slide, left, top + Inches(1.0), width, Inches(0.5), "[Screenshot placeholder]", size=12, color=C.MUTED, align=PP_ALIGN.CENTER)

    def _screenshot_slide(title: str, subtitle: str, img_name: str, points: list[str], caption: str = "") -> None:
        slide = _new_content(title, subtitle)
        _bullets(slide, points, top=Inches(1.35), left=Inches(0.75), width=Inches(5.9), size=13, gap=0.46)
        img = _screenshot(img_name)
        _add_image(slide, img, Inches(6.85), Inches(1.3), Inches(6.1))
        if caption:
            _textbox(slide, Inches(6.85), Inches(6.55), Inches(6.1), Inches(0.35), caption, size=10, color=C.MUTED, align=PP_ALIGN.CENTER)

    # ── Title ──
    slide_num[0] += 1
    slide = prs.slides.add_slide(blank)
    panel = slide.shapes.add_shape(1, 0, 0, Inches(5.2), H)
    _fill(panel, C.FOREST_DARK)
    right = slide.shapes.add_shape(1, Inches(5.2), 0, W - Inches(5.2), H)
    _fill(right, C.CREAM)
    line = slide.shapes.add_shape(1, Inches(5.15), Inches(1.8), Inches(0.06), Inches(3.8))
    _fill(line, C.ACCENT)
    _textbox(slide, Inches(0.7), Inches(2.0), Inches(4.2), Inches(0.4), "GUNI SSRIP 2026", size=13, color=RGBColor(0xA8, 0xC4, 0xB8))
    _textbox(slide, Inches(0.7), Inches(2.45), Inches(4.2), Inches(1.2), "OpinionPulse", size=44, bold=True, color=C.WHITE)
    _textbox(slide, Inches(0.7), Inches(3.55), Inches(4.2), Inches(1.0), "AI-Powered Public\nOpinion Tracking Platform", size=18, color=RGBColor(0xD4, 0xE4, 0xDE))
    _textbox(slide, Inches(5.55), Inches(2.35), Inches(7.2), Inches(0.5), "Project Presentation", size=14, bold=True, color=C.MUTED)
    _textbox(
        slide,
        Inches(5.55),
        Inches(2.95),
        Inches(7.2),
        Inches(1.6),
        "Full-stack web platform that aggregates,\nanalyzes, and visualizes public opinion\nfrom 13+ live data sources",
        size=24,
        bold=True,
        color=C.TEXT,
    )
    _textbox(slide, Inches(5.55), Inches(4.75), Inches(7.2), Inches(0.4), PROJECT["institute"], size=14, color=C.MUTED)
    _textbox(slide, Inches(5.55), Inches(5.2), Inches(7.2), Inches(0.5), "Shefil Khan  ·  Khush Patel", size=14, color=C.TEXT)
    _footer(slide)

    # ── Agenda ──
    slide = _new_content("Presentation Agenda", "Project documentation — not weekly progress report")
    _bullets(
        slide,
        [
            "Project introduction, objectives, and scope",
            "System architecture and technology stack",
            "Application modules with UI screenshots",
            "Multi-source data integration and AI pipeline",
            "Database design, security, and subscription model",
            "Future enhancements and conclusion",
        ],
        top=Inches(1.4),
        size=16,
        gap=0.58,
    )

    # ── Project introduction ──
    slide = _new_content("Project Introduction", PROJECT["title"])
    _paragraph_block(
        slide,
        "OpinionPulse is a full-stack web application built during the GUNI Summer Student Research "
        "Internship Program (SSRIP). It helps researchers, journalists, and analysts understand how "
        "the public feels about any topic by searching news articles, social posts, and developer "
        "communities in one place — then scoring sentiment and generating AI summaries.",
        top=Inches(1.35),
    )
    _bullets(
        slide,
        [
            "Purpose: unify scattered online conversations into actionable sentiment intelligence",
            "Users enter a keyword (e.g. climate change, AI regulation) and receive live results within seconds",
            "Each result is tagged positive, neutral, or negative with source links and engagement metrics",
            "Pro users unlock Pulse AI chat, compare mode, risk scoring, and advanced analytics",
        ],
        top=Inches(2.55),
        size=14,
        gap=0.5,
    )

    # ── Problem & objectives ──
    slide = _new_content("Problem Statement & Objectives", "Why this project exists")
    _bullets(
        slide,
        [
            "Problem: public opinion is fragmented across Reddit, YouTube, news sites, GitHub, Hacker News, and more — manual tracking is slow and inconsistent",
            "Objective 1: build a single dashboard that searches all major opinion sources in parallel",
            "Objective 2: apply automated sentiment analysis so users see positive/neutral/negative breakdown instantly",
            "Objective 3: integrate AI (Groq Llama 3.3) to answer natural-language questions using freshly fetched data",
            "Objective 4: provide exportable reports (CSV/PDF) and alerts for ongoing topic monitoring",
        ],
        top=Inches(1.35),
        size=14,
        gap=0.48,
    )

    # ── Scope & users ──
    slide = _new_content("Project Scope & Target Users", "What the platform delivers")
    cols = [
        ("In Scope", [
            "Multi-source keyword search with time and platform filters",
            "Side-by-side topic comparison with sentiment charts",
            "Live dashboard: trending topics, debates, platform pulse",
            "Pulse AI assistant with real search context",
            "User accounts with JWT auth, OTP email, Google OAuth",
            "Starter / Pro subscription tiers with usage limits",
        ]),
        ("Target Users", [
            "Journalists tracking breaking story sentiment",
            "Researchers studying public opinion trends",
            "Marketing teams monitoring brand perception",
            "Policy analysts comparing debate narratives",
            "Students learning full-stack + AI integration",
        ]),
    ]
    for i, (heading, items) in enumerate(cols):
        left = Inches(0.75 + i * 6.35)
        box = slide.shapes.add_shape(1, left, Inches(1.45), Inches(6.0), Inches(5.5))
        _fill(box, C.WHITE)
        box.line.color.rgb = C.LINE
        head = slide.shapes.add_shape(1, left, Inches(1.45), Inches(6.0), Inches(0.5))
        _fill(head, C.FOREST if i == 0 else C.ACCENT)
        _textbox(slide, left + Inches(0.2), Inches(1.52), Inches(5.6), Inches(0.35), heading, size=15, bold=True, color=C.WHITE, align=PP_ALIGN.CENTER)
        _bullets(slide, items, top=Inches(2.15), left=left + Inches(0.25), width=Inches(5.5), size=13, gap=0.44)

    # ── Architecture ──
    slide = _new_content("System Architecture", "Three-tier design with async API aggregation")
    layers = [
        ("Presentation Layer", "React 18 + TypeScript SPA\nPages: Landing, Dashboard, Search, Compare,\nChat, Reports, Alerts, Settings, Explore sandbox"),
        ("Application Layer", "FastAPI REST API\nServices: search, sentiment, chat, dashboard,\nreports, billing, OAuth, email OTP"),
        ("Data Layer", "MySQL (XAMPP) via SQLAlchemy\nTables: users, plans, search_history,\nmentions, chat_sessions, reports, alerts"),
        ("External APIs", "13 platforms queried in parallel\nNewsAPI, Guardian, GNews, Currents,\nMediaStack, Reddit, YouTube, GitHub, etc."),
    ]
    y = Inches(1.35)
    for heading, body in layers:
        card = slide.shapes.add_shape(1, Inches(0.75), y, Inches(11.85), Inches(1.15))
        _fill(card, C.WHITE)
        card.line.color.rgb = C.LINE
        tag = slide.shapes.add_shape(1, Inches(0.75), y, Inches(2.4), Inches(1.15))
        _fill(tag, C.FOREST)
        _textbox(slide, Inches(0.9), y + Inches(0.35), Inches(2.1), Inches(0.5), heading, size=13, bold=True, color=C.WHITE)
        _textbox(slide, Inches(3.35), y + Inches(0.18), Inches(8.9), Inches(0.85), body, size=12, color=C.TEXT)
        y += Inches(1.28)

    # ── Tech stack ──
    slide = _new_content("Technology Stack", "Tools and frameworks used in development")
    stacks = [
        ("Frontend", [
            "React 18 + TypeScript — component-based UI",
            "Vite — fast dev server and production bundler",
            "Tailwind CSS — responsive editorial design system",
            "React Query — cached API state management",
            "Recharts — sentiment charts and trend graphs",
        ]),
        ("Backend", [
            "Python FastAPI — async REST endpoints",
            "SQLAlchemy ORM — MySQL database models",
            "Pydantic — request/response validation",
            "JWT + bcrypt — secure authentication",
            "Gmail SMTP — OTP verification emails",
        ]),
        ("AI & Integrations", [
            "Groq (Llama 3.3 70B) — Pulse AI chat responses",
            "Anthropic Claude — Pro-tier insight generation",
            "VADER + keyword scoring — sentiment engine",
            "13 external APIs — parallel async fetch with 3-min cache",
        ]),
    ]
    for i, (heading, items) in enumerate(stacks):
        left = Inches(0.75 + i * 4.15)
        box = slide.shapes.add_shape(1, left, Inches(1.4), Inches(3.85), Inches(5.6))
        _fill(box, C.WHITE)
        box.line.color.rgb = C.LINE
        head_bar = slide.shapes.add_shape(1, left, Inches(1.4), Inches(3.85), Inches(0.5))
        _fill(head_bar, C.FOREST if i == 0 else (C.ACCENT if i == 1 else RGBColor(0x2D, 0x6A, 0x4E)))
        _textbox(slide, left + Inches(0.2), Inches(1.47), Inches(3.5), Inches(0.35), heading, size=14, bold=True, color=C.WHITE, align=PP_ALIGN.CENTER)
        _bullets(slide, items, top=Inches(2.05), left=left + Inches(0.2), width=Inches(3.45), size=12, gap=0.42)

    _new_section("Application Modules", "Detailed walkthrough with screenshots")

    _screenshot_slide(
        "Landing Page & Onboarding",
        "Public-facing entry point for new users",
        "01_landing_hero",
        [
            "Editorial-style landing page introduces OpinionPulse value proposition",
            "Hero section explains real-time multi-source opinion tracking",
            "Feature blocks describe Search, Compare, Dashboard, and Pulse AI modules",
            "Pricing section shows Starter (free) and Pro plans with feature comparison",
            "Call-to-action routes users to sign-up or the interactive Explore sandbox",
        ],
        caption="Screenshot: Landing page hero section",
    )

    _screenshot_slide(
        "Landing Page — Feature Overview",
        "How the product is explained to visitors",
        "02_landing_features",
        [
            "Three-step workflow: Search any topic → Analyze sentiment → Act on insights",
            "Tech stack section highlights React, FastAPI, Groq AI, and 13 data sources",
            "Social proof and editorial quote reinforce research-grade credibility",
            "Footer links to Terms of Service and Privacy Policy for compliance",
        ],
        caption="Screenshot: Landing page features section",
    )

    _screenshot_slide(
        "Interactive Explore Sandbox",
        "Public demo — no login required",
        "03_explore_search_results",
        [
            "Explore page lets visitors try OpinionPulse before creating an account",
            "Pre-built topics (Bitcoin, AI, Climate) show sample multi-platform results",
            "Each card displays platform badge, author, timestamp, sentiment tag, and engagement",
            "AI summary paragraph explains overall sentiment direction for the topic",
            "Users can also type a custom keyword to run a live API search",
        ],
        caption="Screenshot: Explore sandbox — Bitcoin topic results",
    )

    _screenshot_slide(
        "Dashboard Module",
        "Central hub for sentiment overview and trending activity",
        "04_explore_dashboard",
        [
            "Dashboard shows sentiment balance (% positive), trending topic count, and live source count",
            "Weekly activity bar chart tracks positive vs negative sentiment over 7 days",
            "Trending topics table lists hot keywords with sentiment direction arrows",
            "Platform pulse widget shows which sources (Reddit, YouTube, news) are most active",
            "Debate tracker highlights polarized discussions across platforms",
        ],
        caption="Screenshot: Dashboard preview (Explore sandbox)",
    )

    slide = _new_content("Multi-Source Search Engine", "Core module — queries 13 platforms in parallel")
    _paragraph_block(
        slide,
        "When a user searches a keyword, the FastAPI backend fires async requests to every configured "
        "platform simultaneously. Results are deduplicated, sorted by posted date (newest first), "
        "scored for sentiment, and returned with a Wikipedia summary and 24-hour trend chart.",
        top=Inches(1.3),
        size=13,
    )
    sources_left = [
        "Social: Reddit, YouTube, Mastodon, Bluesky",
        "News: NewsAPI, Guardian, GNews, Currents, MediaStack",
        "Tech: Hacker News, Dev.to, GitHub, Stack Overflow",
        "Reference: Wikipedia summary (context panel)",
    ]
    sources_right = [
        "Filters: platform type, time range (24h / 7d / 30d / all)",
        "Headline-focused matching — results must contain query keywords",
        "3-minute in-memory cache reduces API rate-limit hits",
        "Search history saved per user for quick re-access",
        "Sentiment forecast predicts 7-day trend direction",
    ]
    _bullets(slide, sources_left, top=Inches(2.35), left=Inches(0.75), width=Inches(5.8), size=12, gap=0.42)
    _bullets(slide, sources_right, top=Inches(2.35), left=Inches(6.85), width=Inches(5.8), size=12, gap=0.42)
    img = _screenshot("05_explore_ai_topic")
    _add_image(slide, img, Inches(6.85), Inches(5.0), Inches(5.8))

    slide = _new_content("Compare Topics Module", "Side-by-side sentiment analysis for two keywords")
    _bullets(
        slide,
        [
            "User enters Topic A and Topic B (e.g. Tesla vs BYD, Bitcoin vs Ethereum)",
            "Backend runs parallel searches for both topics across all enabled platforms",
            "Results page shows dual sentiment pie charts, platform breakdown, and keyword word clouds",
            "Comparison table highlights which topic has higher positive/negative ratio per platform",
            "Useful for brand rivalry analysis, election tracking, and product launch monitoring",
            "Pro plan required for unlimited compare searches per month",
        ],
        top=Inches(1.35),
        size=14,
        gap=0.46,
    )

    slide = _new_content("Pulse AI Assistant", "Groq-powered conversational intelligence")
    _bullets(
        slide,
        [
            "Floating chat bubble available on every authenticated page",
            "Dedicated /chat page for full-screen conversation history",
            "Before answering, Pulse AI fetches live search results for the user's question",
            "Question classifier routes queries: factual, compare, sentiment, trend, or general",
            "Sports/score queries are detected separately to avoid false compare-mode triggers",
            "Groq Llama 3.3 70B generates concise, data-grounded responses (not generic chatbot text)",
            "Pro users get Claude-powered deep insights: risk profiles, debate analysis, crisis response",
        ],
        top=Inches(1.35),
        size=13,
        gap=0.44,
    )

    slide = _new_content("Analytics, Reports & Alerts", "Turning raw data into actionable output")
    modules = [
        ("Analytics", "Word cloud from extracted keywords, platform sentiment bar chart, 24h trend line graph, sentiment forecast for next 7 days"),
        ("Reports", "Generate CSV or PDF exports of search results with sentiment scores, source URLs, and timestamps. Search history archive for re-download."),
        ("Alerts", "Configure keyword alert rules with sentiment thresholds. System evaluates new mentions and flags spikes in negative sentiment."),
    ]
    for i, (heading, body) in enumerate(modules):
        top = Inches(1.45 + i * 1.75)
        card = slide.shapes.add_shape(1, Inches(0.75), top, Inches(11.85), Inches(1.5))
        _fill(card, C.WHITE)
        card.line.color.rgb = C.LINE
        _textbox(slide, Inches(0.95), top + Inches(0.15), Inches(2.5), Inches(0.35), heading, size=15, bold=True, color=C.FOREST)
        _textbox(slide, Inches(3.55), top + Inches(0.15), Inches(8.8), Inches(1.1), body, size=13, color=C.TEXT)

    _screenshot_slide(
        "Subscription Plans",
        "Starter vs Pro tier feature gating",
        "06_pricing_plans",
        [
            "Starter (Free): limited searches, basic dashboard, explore sandbox access",
            "Pro ($19/mo): unlimited searches, Compare mode, Pulse AI, PDF export, risk scoring",
            "Enterprise: custom API access and team seats (planned)",
            "Usage limits enforced server-side via plan_id on user record",
            "Admin script (set_user_plan.py) allows manual Pro access for demo accounts",
        ],
        caption="Screenshot: Pricing page with plan comparison",
    )

    slide = _new_content("Authentication & Security", "How user accounts are protected")
    _bullets(
        slide,
        [
            "Registration: email + password with bcrypt hashing and email OTP verification (6-digit code via Gmail SMTP)",
            "Login: JWT access tokens with configurable expiry; failed attempts trigger account lockout",
            "Google OAuth 2.0: one-click sign-in with server-side token validation (placeholder client IDs rejected)",
            "Password reset: secure token link sent to registered email address",
            "All project-scoped API routes require Authorization: Bearer header and verify user ownership",
            "Environment variables (.env) store API keys — never committed to Git repository",
        ],
        top=Inches(1.35),
        size=13,
        gap=0.44,
    )

    slide = _new_content("Database Design", "MySQL schema — core entities")
    entities = [
        ("users", "email, password_hash, google_id, plan_id, role, OTP fields, lockout counters"),
        ("search_history", "user_id, query, platform_filter, result_count, created_at"),
        ("mentions", "project_id, source, content, sentiment_score, posted_at, url"),
        ("chat_sessions / chat_messages", "user_id, session title, role (user/assistant), message content"),
        ("plans", "id (starter/pro), search_limit, compare_limit, features JSON"),
        ("reports / alerts", "user_id, query, format, threshold rules, last_evaluated_at"),
    ]
    y = Inches(1.35)
    for table, cols in entities:
        row = slide.shapes.add_shape(1, Inches(0.75), y, Inches(11.85), Inches(0.82))
        _fill(row, C.WHITE)
        row.line.color.rgb = C.LINE
        _textbox(slide, Inches(0.95), y + Inches(0.18), Inches(2.2), Inches(0.4), table, size=13, bold=True, color=C.FOREST)
        _textbox(slide, Inches(3.2), y + Inches(0.18), Inches(9.2), Inches(0.5), cols, size=12, color=C.TEXT)
        y += Inches(0.92)

    slide = _new_content("Data Flow Pipeline", "From user query to AI response")
    steps = [
        ("1. User Input", "Keyword + filters submitted from React SearchPage via POST /api/search"),
        ("2. Parallel Fetch", "search_service.py dispatches asyncio tasks to 13 platform modules simultaneously"),
        ("3. Normalize", "platform_common.py deduplicates by URL, normalizes fields (title, author, posted_at, engagement)"),
        ("4. Sentiment", "VADER + keyword rules score each result; aggregate summary calculated"),
        ("5. Store & Return", "Results cached 3 min, saved to search_history, returned as JSON to frontend"),
        ("6. AI Context", "chat_service.py reuses search results as context for Groq/Claude prompt"),
    ]
    for i, (step, detail) in enumerate(steps):
        col = i % 2
        row = i // 2
        left = Inches(0.75 + col * 6.2)
        top = Inches(1.4 + row * 1.85)
        card = slide.shapes.add_shape(1, left, top, Inches(5.85), Inches(1.55))
        _fill(card, C.WHITE)
        card.line.color.rgb = C.LINE
        _textbox(slide, left + Inches(0.15), top + Inches(0.12), Inches(5.5), Inches(0.35), step, size=13, bold=True, color=C.FOREST)
        _textbox(slide, left + Inches(0.15), top + Inches(0.5), Inches(5.5), Inches(0.9), detail, size=11, color=C.MUTED)

    slide = _new_content("Future Enhancements", "Planned improvements beyond SSRIP")
    _bullets(
        slide,
        [
            "Cloud deployment (AWS/Azure) with production MySQL, HTTPS, and CI/CD pipeline",
            "Stripe payment integration for automated Pro/Enterprise billing",
            "LLM-based sentiment (replacing keyword/VADER) for nuanced technical topics",
            "Email/push alert notifications when sentiment crosses configured thresholds",
            "Mobile-responsive PWA and native app for on-the-go monitoring",
            "Public REST API with documentation for third-party research integrations",
        ],
        top=Inches(1.4),
        size=14,
        gap=0.5,
    )

    slide = _new_content("Project Outcomes", "What we delivered")
    _bullets(
        slide,
        [
            "Fully functional full-stack web application with 13 live data source integrations",
            "Secure authentication system (JWT, OTP, Google OAuth) with role-based plan limits",
            "AI-powered Pulse chat assistant grounded in real-time search data",
            "Professional editorial UI with landing page, explore sandbox, and BankDash-style dashboard",
            "Complete backend API documented at /docs with health checks and smoke tests",
            "Open-source codebase on GitHub — ready for demo and further development",
        ],
        top=Inches(1.4),
        size=14,
        gap=0.5,
    )

    # ── Closing ──
    slide_num[0] += 1
    slide = prs.slides.add_slide(blank)
    _slide_bg(slide, C.FOREST_DARK)
    _textbox(slide, Inches(0.8), Inches(2.2), Inches(11.5), Inches(0.9), "Thank You", size=44, bold=True, color=C.WHITE, align=PP_ALIGN.CENTER)
    _textbox(slide, Inches(0.8), Inches(3.2), Inches(11.5), Inches(0.6), "OpinionPulse — Real-time public opinion intelligence", size=20, color=RGBColor(0xA8, 0xC4, 0xB8), align=PP_ALIGN.CENTER)
    _textbox(slide, Inches(0.8), Inches(4.0), Inches(11.5), Inches(0.5), "Live demo available  ·  Questions welcome", size=16, color=C.ACCENT, align=PP_ALIGN.CENTER)
    _textbox(slide, Inches(0.8), Inches(4.8), Inches(11.5), Inches(0.4), "github.com/Shefilkhan/AI-Opinion-Tracking-", size=12, color=C.MUTED, align=PP_ALIGN.CENTER)
    _footer(slide)

    path = OUT_DIR / "OpinionPulse_SSRIP_Presentation.pptx"
    prs.save(path)
    return path


if __name__ == "__main__":
    import subprocess
    import sys

    missing = {"01_landing_hero", "02_landing_features", "03_explore_search_results",
               "04_explore_dashboard", "05_explore_ai_topic", "06_pricing_plans"} - {
        p.stem for p in SCREENSHOTS_DIR.glob("*.png")
    }
    if missing:
        print(f"Missing screenshots ({len(missing)}) — capturing from local dev server...")
        cap = Path(__file__).resolve().parent / "capture_screenshots.py"
        result = subprocess.run([sys.executable, str(cap)], check=False)
        if result.returncode != 0:
            print("Warning: some screenshots may be missing; PPT will use placeholders where needed.")

    docx_path = build_docx()
    pptx_path = build_pptx()
    print(f"Created: {docx_path}")
    print(f"Created: {pptx_path}")
