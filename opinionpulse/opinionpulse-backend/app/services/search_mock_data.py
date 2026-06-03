"""Rich mock search results with realistic sentiment-bearing content."""

from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta, timezone
from typing import Any

from app.services.sentiment_analysis import (
    apply_sentiment_to_results,
    calculate_sentiment_summary,
)

PLATFORMS = ["twitter", "reddit", "youtube", "news"]

SENTIMENT_TREND_24H = [
    {"time": "12AM", "positive": 42, "negative": 28, "neutral": 30},
    {"time": "2AM", "positive": 38, "negative": 35, "neutral": 27},
    {"time": "4AM", "positive": 45, "negative": 25, "neutral": 30},
    {"time": "6AM", "positive": 52, "negative": 22, "neutral": 26},
    {"time": "8AM", "positive": 48, "negative": 30, "neutral": 22},
    {"time": "10AM", "positive": 55, "negative": 28, "neutral": 17},
    {"time": "12PM", "positive": 60, "negative": 20, "neutral": 20},
    {"time": "2PM", "positive": 65, "negative": 18, "neutral": 17},
    {"time": "4PM", "positive": 58, "negative": 25, "neutral": 17},
    {"time": "6PM", "positive": 50, "negative": 32, "neutral": 18},
    {"time": "8PM", "positive": 45, "negative": 35, "neutral": 20},
    {"time": "10PM", "positive": 48, "negative": 30, "neutral": 22},
]


def _hours_ago(h: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=h)).isoformat()


def _mock_bitcoin() -> list[dict[str, Any]]:
    return [
        {
            "id": "btc-1",
            "platform": "twitter",
            "author": "@crypto_analyst",
            "content": "Bitcoin just hit a new milestone! The adoption rate is incredible and the future looks very promising. Bullish on BTC!",
            "url": "https://twitter.com/example/btc/1",
            "posted_at": _hours_ago(1),
            "engagement": {"likes": 4821, "shares": 1203, "comments": 342},
        },
        {
            "id": "btc-2",
            "platform": "reddit",
            "author": "u/investing_daily",
            "content": "Bitcoin crashed again. This is a disaster. Lost everything in this terrible market. The volatility is insane and dangerous for retail investors.",
            "url": "https://reddit.com/example/btc/2",
            "posted_at": _hours_ago(2),
            "engagement": {"likes": 892, "shares": 234, "comments": 567},
        },
        {
            "id": "btc-3",
            "platform": "news",
            "author": "CoinDesk",
            "content": "Bitcoin price stabilizes as institutional investors show strong support. Analysts predict growth in Q4 with record adoption numbers.",
            "url": "https://coindesk.com/example/btc/3",
            "posted_at": _hours_ago(3),
            "engagement": {"likes": 2341, "shares": 891, "comments": 124},
        },
        {
            "id": "btc-4",
            "platform": "twitter",
            "author": "@blockchain_news",
            "content": "Warning: Major Bitcoin hack reported. Thousands of wallets compromised. This is a serious threat to the entire ecosystem.",
            "url": "https://twitter.com/example/btc/4",
            "posted_at": _hours_ago(4),
            "engagement": {"likes": 12043, "shares": 8932, "comments": 2341},
        },
        {
            "id": "btc-5",
            "platform": "youtube",
            "author": "CryptoExplained",
            "content": "Bitcoin is the best investment of the decade. Amazing returns, incredible technology. Love this revolutionary innovation!",
            "url": "https://youtube.com/example/btc/5",
            "posted_at": _hours_ago(5),
            "engagement": {"likes": 34210, "shares": 4320, "comments": 8932},
        },
        {
            "id": "btc-6",
            "platform": "reddit",
            "author": "u/market_watch",
            "content": "Bitcoin trading volume on major exchanges reached a new record. Price data and blockchain metrics updated hourly.",
            "url": "https://reddit.com/example/btc/6",
            "posted_at": _hours_ago(6),
            "engagement": {"likes": 445, "shares": 89, "comments": 201},
        },
        {
            "id": "btc-7",
            "platform": "twitter",
            "author": "@defi_trader",
            "content": "Strong surge in Bitcoin ETF inflows. Optimistic outlook as institutions gain exposure. Success story for digital assets.",
            "url": "https://twitter.com/example/btc/7",
            "posted_at": _hours_ago(7),
            "engagement": {"likes": 6721, "shares": 2100, "comments": 890},
        },
        {
            "id": "btc-8",
            "platform": "news",
            "author": "Reuters Crypto",
            "content": "Regulators issue warning on unregulated crypto exchanges. Concern grows over fraud and illegal schemes targeting Bitcoin holders.",
            "url": "https://reuters.com/example/btc/8",
            "posted_at": _hours_ago(8),
            "engagement": {"likes": 1890, "shares": 654, "comments": 412},
        },
        {
            "id": "btc-9",
            "platform": "youtube",
            "author": "MacroDaily",
            "content": "The Bitcoin market faces weak demand as bears push price down. Failure to hold support could mean another major drop ahead.",
            "url": "https://youtube.com/example/btc/9",
            "posted_at": _hours_ago(9),
            "engagement": {"likes": 5600, "shares": 1200, "comments": 2300},
        },
        {
            "id": "btc-10",
            "platform": "twitter",
            "author": "@hodl_forever",
            "content": "Holding Bitcoin long term has been my best decision. Trusted, secure, and brilliant store of value through every cycle.",
            "url": "https://twitter.com/example/btc/10",
            "posted_at": _hours_ago(10),
            "engagement": {"likes": 9200, "shares": 3100, "comments": 780},
        },
        {
            "id": "btc-11",
            "platform": "reddit",
            "author": "u/crypto_neutral",
            "content": "Discussion thread: Bitcoin wallet security best practices. Exchange listings and token standards explained for beginners.",
            "url": "https://reddit.com/example/btc/11",
            "posted_at": _hours_ago(11),
            "engagement": {"likes": 1200, "shares": 300, "comments": 890},
        },
        {
            "id": "btc-12",
            "platform": "news",
            "author": "Bloomberg",
            "content": "Bitcoin miners report excellent quarterly profit as energy costs fall. Outstanding operational efficiency drives positive investor sentiment.",
            "url": "https://bloomberg.com/example/btc/12",
            "posted_at": _hours_ago(12),
            "engagement": {"likes": 4100, "shares": 1500, "comments": 320},
        },
        {
            "id": "btc-13",
            "platform": "twitter",
            "author": "@panic_seller",
            "content": "Selling all Bitcoin now. This bubble will collapse and I refuse to lose more. Worst decision was listening to the hype.",
            "url": "https://twitter.com/example/btc/13",
            "posted_at": _hours_ago(13),
            "engagement": {"likes": 3300, "shares": 980, "comments": 2100},
        },
        {
            "id": "btc-14",
            "platform": "youtube",
            "author": "Blockchain101",
            "content": "How blockchain consensus works: a neutral explainer on Bitcoin network upgrades and mempool dynamics.",
            "url": "https://youtube.com/example/btc/14",
            "posted_at": _hours_ago(14),
            "engagement": {"likes": 8900, "shares": 2200, "comments": 1100},
        },
        {
            "id": "btc-15",
            "platform": "reddit",
            "author": "u/bull_run",
            "content": "Bitcoin dominance rising again — fantastic news for the whole crypto market. Growth and adoption accelerating worldwide!",
            "url": "https://reddit.com/example/btc/15",
            "posted_at": _hours_ago(15),
            "engagement": {"likes": 5400, "shares": 1100, "comments": 670},
        },
    ]


def _mock_ai() -> list[dict[str, Any]]:
    return [
        {
            "id": "ai-1",
            "platform": "twitter",
            "author": "@tech_future",
            "content": "Artificial intelligence breakthrough is incredible! Revolutionary tools are transforming every industry. Optimistic about the future of AI.",
            "url": "https://twitter.com/example/ai/1",
            "posted_at": _hours_ago(1),
            "engagement": {"likes": 8900, "shares": 2400, "comments": 1200},
        },
        {
            "id": "ai-2",
            "platform": "news",
            "author": "Wired",
            "content": "Experts warn AI poses serious risk to jobs and privacy. Concern grows over unregulated models and potential for fraud at scale.",
            "url": "https://wired.com/example/ai/2",
            "posted_at": _hours_ago(2),
            "engagement": {"likes": 3200, "shares": 1100, "comments": 890},
        },
        {
            "id": "ai-3",
            "platform": "reddit",
            "author": "u/ml_researcher",
            "content": "New paper on large language models shows outstanding benchmark results. Promising path toward safe, trusted AI systems.",
            "url": "https://reddit.com/example/ai/3",
            "posted_at": _hours_ago(3),
            "engagement": {"likes": 2100, "shares": 540, "comments": 430},
        },
        {
            "id": "ai-4",
            "platform": "youtube",
            "author": "AI Explained",
            "content": "ChatGPT and automation: amazing productivity gains for developers. Love how innovation is accelerating research workflows.",
            "url": "https://youtube.com/example/ai/4",
            "posted_at": _hours_ago(4),
            "engagement": {"likes": 45000, "shares": 8900, "comments": 5600},
        },
        {
            "id": "ai-5",
            "platform": "twitter",
            "author": "@ethics_watch",
            "content": "AI regulation failure in Congress is a disaster. Dangerous systems deployed without oversight — worst timeline for society.",
            "url": "https://twitter.com/example/ai/5",
            "posted_at": _hours_ago(5),
            "engagement": {"likes": 6700, "shares": 3200, "comments": 1900},
        },
        {
            "id": "ai-6",
            "platform": "news",
            "author": "MIT Tech Review",
            "content": "Survey: enterprise AI adoption reached a record high. Strong support from CIOs citing measurable profit and growth.",
            "url": "https://technologyreview.com/example/ai/6",
            "posted_at": _hours_ago(6),
            "engagement": {"likes": 1800, "shares": 620, "comments": 210},
        },
        {
            "id": "ai-7",
            "platform": "reddit",
            "author": "u/neutral_tech",
            "content": "Megathread: compare leading AI models — benchmarks, pricing, and API limits. Factual discussion without hype.",
            "url": "https://reddit.com/example/ai/7",
            "posted_at": _hours_ago(7),
            "engagement": {"likes": 3400, "shares": 800, "comments": 2200},
        },
        {
            "id": "ai-8",
            "platform": "youtube",
            "author": "FutureOfWork",
            "content": "AI will eliminate millions of jobs — bearish outlook on labor markets. Fall in hiring already visible across tech sector.",
            "url": "https://youtube.com/example/ai/8",
            "posted_at": _hours_ago(8),
            "engagement": {"likes": 12000, "shares": 3400, "comments": 4500},
        },
        {
            "id": "ai-9",
            "platform": "twitter",
            "author": "@startup_founder",
            "content": "Our AI assistant drove 3x revenue this quarter. Excellent product-market fit and happy customers worldwide!",
            "url": "https://twitter.com/example/ai/9",
            "posted_at": _hours_ago(9),
            "engagement": {"likes": 5100, "shares": 1400, "comments": 670},
        },
        {
            "id": "ai-10",
            "platform": "news",
            "author": "The Verge",
            "content": "OpenAI announces new model with improved safety benchmarks. Analysts call it a milestone for responsible deployment.",
            "url": "https://theverge.com/example/ai/10",
            "posted_at": _hours_ago(10),
            "engagement": {"likes": 2900, "shares": 980, "comments": 540},
        },
        {
            "id": "ai-11",
            "platform": "reddit",
            "author": "u/ai_skeptic",
            "content": "Deepfakes and AI scams are out of control. Hackers use generative tools for fraud — volatile and unstable situation online.",
            "url": "https://reddit.com/example/ai/11",
            "posted_at": _hours_ago(11),
            "engagement": {"likes": 7800, "shares": 2100, "comments": 3400},
        },
        {
            "id": "ai-12",
            "platform": "youtube",
            "author": "CodeWithAI",
            "content": "Tutorial: building RAG pipelines with open models. Neutral walkthrough of embeddings, retrieval, and inference costs.",
            "url": "https://youtube.com/example/ai/12",
            "posted_at": _hours_ago(12),
            "engagement": {"likes": 22000, "shares": 5600, "comments": 1800},
        },
        {
            "id": "ai-13",
            "platform": "twitter",
            "author": "@health_ai",
            "content": "AI diagnostics saved lives in pilot hospitals. Brilliant collaboration between doctors and machine learning teams.",
            "url": "https://twitter.com/example/ai/13",
            "posted_at": _hours_ago(13),
            "engagement": {"likes": 11200, "shares": 4300, "comments": 920},
        },
        {
            "id": "ai-14",
            "platform": "news",
            "author": "FT",
            "content": "Chip export ban sparks concern among AI startups. Supply chain issues threaten growth plans for Q4.",
            "url": "https://ft.com/example/ai/14",
            "posted_at": _hours_ago(14),
            "engagement": {"likes": 1500, "shares": 400, "comments": 180},
        },
        {
            "id": "ai-15",
            "platform": "reddit",
            "author": "u/optimist_dev",
            "content": "Open-source AI community is thriving — best ecosystem for innovation I've ever seen. Excited for what's next!",
            "url": "https://reddit.com/example/ai/15",
            "posted_at": _hours_ago(15),
            "engagement": {"likes": 4900, "shares": 1200, "comments": 890},
        },
    ]


def _mock_climate() -> list[dict[str, Any]]:
    return [
        {
            "id": "cl-1",
            "platform": "news",
            "author": "Guardian",
            "content": "Renewable energy adoption hits record levels. Optimistic leaders celebrate strong growth in solar and wind investment.",
            "url": "https://theguardian.com/example/cl/1",
            "posted_at": _hours_ago(1),
            "engagement": {"likes": 4200, "shares": 1800, "comments": 890},
        },
        {
            "id": "cl-2",
            "platform": "twitter",
            "author": "@climate_alert",
            "content": "Climate crisis worsening — terrible flooding and crop failure. Fear and panic as communities face another disastrous summer.",
            "url": "https://twitter.com/example/cl/2",
            "posted_at": _hours_ago(2),
            "engagement": {"likes": 15000, "shares": 6700, "comments": 3200},
        },
        {
            "id": "cl-3",
            "platform": "reddit",
            "author": "u/eco_news",
            "content": "IPCC report summary thread: key temperature targets, carbon budgets, and policy timelines explained factually.",
            "url": "https://reddit.com/example/cl/3",
            "posted_at": _hours_ago(3),
            "engagement": {"likes": 5600, "shares": 1400, "comments": 2100},
        },
        {
            "id": "cl-4",
            "platform": "youtube",
            "author": "PlanetToday",
            "content": "Corporate greenwashing exposed — awful failure to meet pledges. Angry activists demand accountability and real action.",
            "url": "https://youtube.com/example/cl/4",
            "posted_at": _hours_ago(4),
            "engagement": {"likes": 28000, "shares": 9000, "comments": 6700},
        },
        {
            "id": "cl-5",
            "platform": "twitter",
            "author": "@green_future",
            "content": "Electric vehicle sales surge worldwide! Excellent milestone for clean transport and promising air quality gains.",
            "url": "https://twitter.com/example/cl/5",
            "posted_at": _hours_ago(5),
            "engagement": {"likes": 7800, "shares": 2300, "comments": 1100},
        },
        {
            "id": "cl-6",
            "platform": "news",
            "author": "NYT Climate",
            "content": "Oil lobby blocks climate bill again — worst setback for advocates in a decade. Concern over political inaction grows.",
            "url": "https://nytimes.com/example/cl/6",
            "posted_at": _hours_ago(6),
            "engagement": {"likes": 3100, "shares": 1200, "comments": 2400},
        },
        {
            "id": "cl-7",
            "platform": "reddit",
            "author": "u/solar_fan",
            "content": "My city cut emissions 30% — fantastic local policy win! Proud of our community's success with heat pumps and transit.",
            "url": "https://reddit.com/example/cl/7",
            "posted_at": _hours_ago(7),
            "engagement": {"likes": 9200, "shares": 2100, "comments": 780},
        },
        {
            "id": "cl-8",
            "platform": "youtube",
            "author": "ScienceDaily",
            "content": "Antarctic ice loss accelerating — dangerous tipping points may be near. Scientists issue urgent warning to world leaders.",
            "url": "https://youtube.com/example/cl/8",
            "posted_at": _hours_ago(8),
            "engagement": {"likes": 19000, "shares": 5400, "comments": 4100},
        },
        {
            "id": "cl-9",
            "platform": "twitter",
            "author": "@cop28_live",
            "content": "Summit negotiators reach historic agreement on methane cuts. Strong diplomatic support hailed as major breakthrough.",
            "url": "https://twitter.com/example/cl/9",
            "posted_at": _hours_ago(9),
            "engagement": {"likes": 6400, "shares": 2800, "comments": 1500},
        },
        {
            "id": "cl-10",
            "platform": "news",
            "author": "BBC Earth",
            "content": "Global mean temperature data for September published. Figures compared to pre-industrial baseline in official tables.",
            "url": "https://bbc.com/example/cl/10",
            "posted_at": _hours_ago(10),
            "engagement": {"likes": 2100, "shares": 890, "comments": 450},
        },
        {
            "id": "cl-11",
            "platform": "reddit",
            "author": "u/denier_watch",
            "content": "Misinformation campaigns spreading fear about climate science. Hate seeing fraudsters undermine trusted research.",
            "url": "https://reddit.com/example/cl/11",
            "posted_at": _hours_ago(11),
            "engagement": {"likes": 4300, "shares": 1100, "comments": 2900},
        },
        {
            "id": "cl-12",
            "platform": "youtube",
            "author": "EcoInnovate",
            "content": "Carbon capture startup secures huge funding — amazing technology with outstanding efficiency in pilot plants!",
            "url": "https://youtube.com/example/cl/12",
            "posted_at": _hours_ago(12),
            "engagement": {"likes": 11000, "shares": 3200, "comments": 1400},
        },
        {
            "id": "cl-13",
            "platform": "twitter",
            "author": "@storm_watch",
            "content": "Hurricane season damage estimates are horrifying. Weak infrastructure failed — billions in losses across the region.",
            "url": "https://twitter.com/example/cl/13",
            "posted_at": _hours_ago(13),
            "engagement": {"likes": 9800, "shares": 4100, "comments": 2200},
        },
        {
            "id": "cl-14",
            "platform": "news",
            "author": "Reuters",
            "content": "EU carbon market price update: trading volumes and allowance auction schedule for the week ahead.",
            "url": "https://reuters.com/example/cl/14",
            "posted_at": _hours_ago(14),
            "engagement": {"likes": 890, "shares": 320, "comments": 120},
        },
        {
            "id": "cl-15",
            "platform": "reddit",
            "author": "u/youth_climate",
            "content": "Student climate march drew record crowds — brilliant organizing and passionate speeches for a secure future!",
            "url": "https://reddit.com/example/cl/15",
            "posted_at": _hours_ago(15),
            "engagement": {"likes": 12500, "shares": 3400, "comments": 980},
        },
    ]


def _mock_elections() -> list[dict[str, Any]]:
    return [
        {
            "id": "el-1",
            "platform": "news",
            "author": "AP Politics",
            "content": "Candidate leads in latest polls with strong support from suburban voters. Optimistic campaign celebrates record fundraising.",
            "url": "https://apnews.com/example/el/1",
            "posted_at": _hours_ago(1),
            "engagement": {"likes": 5200, "shares": 2100, "comments": 3400},
        },
        {
            "id": "el-2",
            "platform": "twitter",
            "author": "@election_watch",
            "content": "Voter suppression concerns rise — terrible reports from multiple states. Fear that democracy is under serious threat.",
            "url": "https://twitter.com/example/el/2",
            "posted_at": _hours_ago(2),
            "engagement": {"likes": 18000, "shares": 8900, "comments": 5600},
        },
        {
            "id": "el-3",
            "platform": "reddit",
            "author": "u/political_neutral",
            "content": "Explainer: how the electoral college works and key dates on the 2024 calendar. Factual resources linked in comments.",
            "url": "https://reddit.com/example/el/3",
            "posted_at": _hours_ago(3),
            "engagement": {"likes": 6700, "shares": 1800, "comments": 4200},
        },
        {
            "id": "el-4",
            "platform": "youtube",
            "author": "DebateNight",
            "content": "Last night's debate was a disaster for incumbents — awful performance and weak answers on the economy.",
            "url": "https://youtube.com/example/el/4",
            "posted_at": _hours_ago(4),
            "engagement": {"likes": 34000, "shares": 12000, "comments": 8900},
        },
        {
            "id": "el-5",
            "platform": "twitter",
            "author": "@vote_ready",
            "content": "Record early voting turnout — fantastic civic engagement! Love seeing communities mobilize for a successful election.",
            "url": "https://twitter.com/example/el/5",
            "posted_at": _hours_ago(5),
            "engagement": {"likes": 11200, "shares": 4500, "comments": 2100},
        },
        {
            "id": "el-6",
            "platform": "news",
            "author": "Politico",
            "content": "Scandal rocks opposition party as fraud investigation expands. Crisis management team struggles to contain negative fallout.",
            "url": "https://politico.com/example/el/6",
            "posted_at": _hours_ago(6),
            "engagement": {"likes": 8900, "shares": 4300, "comments": 6700},
        },
        {
            "id": "el-7",
            "platform": "reddit",
            "author": "u/policy_wonk",
            "content": "Healthcare policy comparison chart updated — neutral analysis of both platforms' published proposals.",
            "url": "https://reddit.com/example/el/7",
            "posted_at": _hours_ago(7),
            "engagement": {"likes": 3200, "shares": 900, "comments": 1800},
        },
        {
            "id": "el-8",
            "platform": "youtube",
            "author": "GlobalVotes",
            "content": "International observers praise peaceful election process. Excellent turnout and trusted ballot handling reported.",
            "url": "https://youtube.com/example/el/8",
            "posted_at": _hours_ago(8),
            "engagement": {"likes": 8900, "shares": 2800, "comments": 1200},
        },
        {
            "id": "el-9",
            "platform": "twitter",
            "author": "@fact_check",
            "content": "Misinformation surge on social platforms — dangerous false claims spreading panic about vote counting systems.",
            "url": "https://twitter.com/example/el/9",
            "posted_at": _hours_ago(9),
            "engagement": {"likes": 14500, "shares": 6700, "comments": 4300},
        },
        {
            "id": "el-10",
            "platform": "news",
            "author": "CNN",
            "content": "Swing state map updated with new polling averages. County-level data available in interactive graphics.",
            "url": "https://cnn.com/example/el/10",
            "posted_at": _hours_ago(10),
            "engagement": {"likes": 4100, "shares": 1500, "comments": 2900},
        },
        {
            "id": "el-11",
            "platform": "reddit",
            "author": "u/hopeful_voter",
            "content": "Grassroots organizing win in our district — amazing volunteers delivered outstanding get-out-the-vote results!",
            "url": "https://reddit.com/example/el/11",
            "posted_at": _hours_ago(11),
            "engagement": {"likes": 7800, "shares": 2100, "comments": 980},
        },
        {
            "id": "el-12",
            "platform": "youtube",
            "author": "PolicyPulse",
            "content": "Economic plans debated: inflation, jobs, and debt. Mixed expert views with no clear consensus in panel discussion.",
            "url": "https://youtube.com/example/el/12",
            "posted_at": _hours_ago(12),
            "engagement": {"likes": 5600, "shares": 1400, "comments": 3200},
        },
        {
            "id": "el-13",
            "platform": "twitter",
            "author": "@campaign_trail",
            "content": "Rally draws huge crowd — best energy we've seen! Promising speech on unity and future growth for all Americans.",
            "url": "https://twitter.com/example/el/13",
            "posted_at": _hours_ago(13),
            "engagement": {"likes": 21000, "shares": 8900, "comments": 4500},
        },
        {
            "id": "el-14",
            "platform": "news",
            "author": "NPR",
            "content": "Court ruling on ballot access rules issued today. Full text of the decision and dissent published online.",
            "url": "https://npr.org/example/el/14",
            "posted_at": _hours_ago(14),
            "engagement": {"likes": 2300, "shares": 890, "comments": 1100},
        },
        {
            "id": "el-15",
            "platform": "reddit",
            "author": "u/angry_citizen",
            "content": "Corruption allegations are the worst I've seen. Hate how broken the system feels — complete failure of leadership.",
            "url": "https://reddit.com/example/el/15",
            "posted_at": _hours_ago(15),
            "engagement": {"likes": 13400, "shares": 4500, "comments": 5600},
        },
    ]


def _mock_elon() -> list[dict[str, Any]]:
    return [
        {
            "id": "em-1",
            "platform": "twitter",
            "author": "@elon_updates",
            "content": "Elon Musk announces incredible innovation at SpaceX — successful launch and outstanding engineering milestone!",
            "url": "https://twitter.com/example/em/1",
            "posted_at": _hours_ago(1),
            "engagement": {"likes": 45000, "shares": 12000, "comments": 8900},
        },
        {
            "id": "em-2",
            "platform": "reddit",
            "author": "u/tesla_owner",
            "content": "Love my Tesla — best car I've ever owned. Amazing software updates and brilliant autopilot improvements every month.",
            "url": "https://reddit.com/example/em/2",
            "posted_at": _hours_ago(2),
            "engagement": {"likes": 8900, "shares": 2100, "comments": 3400},
        },
        {
            "id": "em-3",
            "platform": "news",
            "author": "Bloomberg",
            "content": "Musk faces criticism over platform moderation failures. Concern grows as hate speech and misinformation spike again.",
            "url": "https://bloomberg.com/example/em/3",
            "posted_at": _hours_ago(3),
            "engagement": {"likes": 6700, "shares": 3200, "comments": 5600},
        },
        {
            "id": "em-4",
            "platform": "youtube",
            "author": "TechCritics",
            "content": "Tesla recall is a disaster — terrible safety record and weak quality control worry investors and drivers alike.",
            "url": "https://youtube.com/example/em/4",
            "posted_at": _hours_ago(4),
            "engagement": {"likes": 23000, "shares": 7800, "comments": 12000},
        },
        {
            "id": "em-5",
            "platform": "twitter",
            "author": "@market_watch",
            "content": "TSLA stock volatile after earnings miss — bearish analysts predict further drop amid debt concerns.",
            "url": "https://twitter.com/example/em/5",
            "posted_at": _hours_ago(5),
            "engagement": {"likes": 12000, "shares": 5400, "comments": 6700},
        },
        {
            "id": "em-6",
            "platform": "reddit",
            "author": "u/space_fan",
            "content": "Starship test flight data thread — technical specs, timeline, and launch window details for enthusiasts.",
            "url": "https://reddit.com/example/em/6",
            "posted_at": _hours_ago(6),
            "engagement": {"likes": 5600, "shares": 1400, "comments": 2100},
        },
        {
            "id": "em-7",
            "platform": "news",
            "author": "Reuters",
            "content": "Neuralink receives FDA approval for next trial phase. Promising results hailed as breakthrough in medical technology.",
            "url": "https://reuters.com/example/em/7",
            "posted_at": _hours_ago(7),
            "engagement": {"likes": 8900, "shares": 4100, "comments": 2300},
        },
        {
            "id": "em-8",
            "platform": "youtube",
            "author": "BusinessInsider",
            "content": "Factory conditions report sparks outrage — awful allegations and serious labor law violations alleged.",
            "url": "https://youtube.com/example/em/8",
            "posted_at": _hours_ago(8),
            "engagement": {"likes": 34000, "shares": 11000, "comments": 15000},
        },
        {
            "id": "em-9",
            "platform": "twitter",
            "author": "@optimist_tech",
            "content": "Starlink expansion brings internet to rural schools — fantastic success story with strong community support!",
            "url": "https://twitter.com/example/em/9",
            "posted_at": _hours_ago(9),
            "engagement": {"likes": 28000, "shares": 9800, "comments": 4500},
        },
        {
            "id": "em-10",
            "platform": "reddit",
            "author": "u/x_drama",
            "content": "Another controversial Musk post goes viral. Neutral summary of reactions across political and tech communities.",
            "url": "https://reddit.com/example/em/10",
            "posted_at": _hours_ago(10),
            "engagement": {"likes": 15000, "shares": 5600, "comments": 9800},
        },
        {
            "id": "em-11",
            "platform": "news",
            "author": "WSJ",
            "content": "SEC investigation into disclosures continues. Legal experts outline timeline and potential outcomes for investors.",
            "url": "https://wsj.com/example/em/11",
            "posted_at": _hours_ago(11),
            "engagement": {"likes": 4500, "shares": 2100, "comments": 3400},
        },
        {
            "id": "em-12",
            "platform": "youtube",
            "author": "EVReview",
            "content": "Cybertruck delivery event exceeded expectations — excellent build quality and happy customers in first impressions!",
            "url": "https://youtube.com/example/em/12",
            "posted_at": _hours_ago(12),
            "engagement": {"likes": 67000, "shares": 19000, "comments": 21000},
        },
        {
            "id": "em-13",
            "platform": "twitter",
            "author": "@short_seller",
            "content": "Musk overpromised again — worst track record on deadlines. Bears celebrate another failed timeline prediction.",
            "url": "https://twitter.com/example/em/13",
            "posted_at": _hours_ago(13),
            "engagement": {"likes": 9800, "shares": 4300, "comments": 5600},
        },
        {
            "id": "em-14",
            "platform": "reddit",
            "author": "u/fan_club",
            "content": "Whatever you think of him, you can't deny the innovation. Revolutionary companies changed multiple industries.",
            "url": "https://reddit.com/example/em/14",
            "posted_at": _hours_ago(14),
            "engagement": {"likes": 21000, "shares": 6700, "comments": 8900},
        },
        {
            "id": "em-15",
            "platform": "news",
            "author": "The Verge",
            "content": "X platform daily active user metrics published for Q3. Ad revenue figures compared year over year in tables.",
            "url": "https://theverge.com/example/em/15",
            "posted_at": _hours_ago(15),
            "engagement": {"likes": 3200, "shares": 1100, "comments": 1800},
        },
    ]


def _mock_default(query: str) -> list[dict[str, Any]]:
    q = query
    return [
        {
            "id": "def-1",
            "platform": "twitter",
            "author": "@trending_now",
            "content": f"Public opinion on {q} is overwhelmingly positive today — amazing support and excellent engagement across feeds!",
            "url": f"https://twitter.com/example/{q}/1",
            "posted_at": _hours_ago(1),
            "engagement": {"likes": 3200, "shares": 890, "comments": 450},
        },
        {
            "id": "def-2",
            "platform": "reddit",
            "author": "u/discussion_hub",
            "content": f"Thread: serious concerns about {q}. Worried users report problems, risk, and failure in recent developments.",
            "url": f"https://reddit.com/example/{q}/2",
            "posted_at": _hours_ago(2),
            "engagement": {"likes": 2100, "shares": 540, "comments": 1200},
        },
        {
            "id": "def-3",
            "platform": "news",
            "author": "Global News",
            "content": f"Analysts publish neutral briefing on {q}: key facts, timeline, and stakeholder positions without major surprises.",
            "url": f"https://news.com/example/{q}/3",
            "posted_at": _hours_ago(3),
            "engagement": {"likes": 1800, "shares": 620, "comments": 210},
        },
        {
            "id": "def-4",
            "platform": "youtube",
            "author": "DailyBrief",
            "content": f"Why {q} matters in 2024 — outstanding explainer with promising outlook for supporters of reform.",
            "url": f"https://youtube.com/example/{q}/4",
            "posted_at": _hours_ago(4),
            "engagement": {"likes": 12000, "shares": 3400, "comments": 2800},
        },
        {
            "id": "def-5",
            "platform": "twitter",
            "author": "@critique_daily",
            "content": f"Terrible take on {q}. This hype is a bubble — crash incoming and bears were right all along.",
            "url": f"https://twitter.com/example/{q}/5",
            "posted_at": _hours_ago(5),
            "engagement": {"likes": 5600, "shares": 2100, "comments": 3400},
        },
        {
            "id": "def-6",
            "platform": "reddit",
            "author": "u/happy_fan",
            "content": f"Love everything about {q}! Best topic this week — success stories and strong growth everywhere I look.",
            "url": f"https://reddit.com/example/{q}/6",
            "posted_at": _hours_ago(6),
            "engagement": {"likes": 4300, "shares": 980, "comments": 670},
        },
        {
            "id": "def-7",
            "platform": "news",
            "author": "Reuters",
            "content": f"Markets react to {q} with mixed signals. Trading volume and price moves documented in overnight report.",
            "url": f"https://reuters.com/example/{q}/7",
            "posted_at": _hours_ago(7),
            "engagement": {"likes": 2400, "shares": 890, "comments": 340},
        },
        {
            "id": "def-8",
            "platform": "youtube",
            "author": "OpinionHour",
            "content": f"Scandal linked to {q} raises danger flags. Hackers and fraudsters exploit confusion — awful situation for consumers.",
            "url": f"https://youtube.com/example/{q}/8",
            "posted_at": _hours_ago(8),
            "engagement": {"likes": 8900, "shares": 3200, "comments": 4500},
        },
        {
            "id": "def-9",
            "platform": "twitter",
            "author": "@data_watch",
            "content": f"Survey data on {q} released: sample size, methodology, and margin of error detailed in thread.",
            "url": f"https://twitter.com/example/{q}/9",
            "posted_at": _hours_ago(9),
            "engagement": {"likes": 1100, "shares": 400, "comments": 890},
        },
        {
            "id": "def-10",
            "platform": "reddit",
            "author": "u/skeptic_zone",
            "content": f"Hate the misinformation around {q}. Dangerous narratives spread panic — worst information ecosystem I've seen.",
            "url": f"https://reddit.com/example/{q}/10",
            "posted_at": _hours_ago(10),
            "engagement": {"likes": 6700, "shares": 1800, "comments": 3200},
        },
        {
            "id": "def-11",
            "platform": "news",
            "author": "AP",
            "content": f"Record adoption figures for {q} signal strong bullish sentiment among institutional investors this quarter.",
            "url": f"https://apnews.com/example/{q}/11",
            "posted_at": _hours_ago(11),
            "engagement": {"likes": 3900, "shares": 1500, "comments": 560},
        },
        {
            "id": "def-12",
            "platform": "youtube",
            "author": "ThinkTank",
            "content": f"Balanced panel debates {q} — experts disagree but agree volatility will remain elevated short term.",
            "url": f"https://youtube.com/example/{q}/12",
            "posted_at": _hours_ago(12),
            "engagement": {"likes": 4500, "shares": 1200, "comments": 2100},
        },
        {
            "id": "def-13",
            "platform": "twitter",
            "author": "@good_news",
            "content": f"Fantastic milestone for {q}! Trusted leaders celebrate innovation and secure a promising future for all.",
            "url": f"https://twitter.com/example/{q}/13",
            "posted_at": _hours_ago(13),
            "engagement": {"likes": 9800, "shares": 4100, "comments": 1200},
        },
        {
            "id": "def-14",
            "platform": "reddit",
            "author": "u/info_only",
            "content": f"FAQ updated for {q} — neutral reference links, glossary, and historical timeline in wiki format.",
            "url": f"https://reddit.com/example/{q}/14",
            "posted_at": _hours_ago(14),
            "engagement": {"likes": 890, "shares": 210, "comments": 450},
        },
        {
            "id": "def-15",
            "platform": "news",
            "author": "BBC",
            "content": f"Crisis response teams address fallout from {q} controversy. Concern over weak policy response dominates headlines.",
            "url": f"https://bbc.com/example/{q}/15",
            "posted_at": _hours_ago(15),
            "engagement": {"likes": 5600, "shares": 2300, "comments": 4100},
        },
        {
            "id": "def-16",
            "platform": "twitter",
            "author": "@viral_post",
            "content": f"Incredible viral moment for {q} — love this community! Best discussion online with excited optimistic energy.",
            "url": f"https://twitter.com/example/{q}/16",
            "posted_at": _hours_ago(16),
            "engagement": {"likes": 22000, "shares": 8900, "comments": 5600},
        },
        {
            "id": "def-17",
            "platform": "youtube",
            "author": "NewsClips",
            "content": f"Documentary on {q} wins praise for outstanding journalism and brilliant storytelling about human impact.",
            "url": f"https://youtube.com/example/{q}/17",
            "posted_at": _hours_ago(17),
            "engagement": {"likes": 15000, "shares": 5400, "comments": 3200},
        },
        {
            "id": "def-18",
            "platform": "reddit",
            "author": "u/bear_case",
            "content": f"Bearish outlook on {q}: decline in fundamentals, loss of confidence, and negative sentiment in surveys.",
            "url": f"https://reddit.com/example/{q}/18",
            "posted_at": _hours_ago(18),
            "engagement": {"likes": 3400, "shares": 890, "comments": 1900},
        },
    ]


def get_mock_results(query: str) -> list[dict[str, Any]]:
    q = query.lower()
    if "bitcoin" in q or "crypto" in q:
        return _mock_bitcoin()
    if "ai" in q or "artificial intelligence" in q:
        return _mock_ai()
    if "climate" in q:
        return _mock_climate()
    if "election" in q:
        return _mock_elections()
    if "elon" in q or "musk" in q or "tesla" in q:
        return _mock_elon()
    return _mock_default(query)


def _seed(query: str) -> int:
    return int(hashlib.md5(query.lower().encode()).hexdigest()[:8], 16)


def generate_mock_search(
    query: str,
    platform_filter: str = "all",
    sentiment_filter: str = "all",
    time_range: str = "24h",
    sort_by: str = "recent",
) -> dict:
    rng = random.Random(_seed(query) + hash(platform_filter) + hash(sentiment_filter))

    platforms = (
        [platform_filter]
        if platform_filter and platform_filter != "all"
        else PLATFORMS
    )

    raw = get_mock_results(query)
    raw = [r for r in raw if r["platform"] in platforms]
    results = apply_sentiment_to_results(raw)

    if sentiment_filter != "all":
        results = [r for r in results if r["sentiment"] == sentiment_filter]

    if sort_by == "mentioned":
        results.sort(key=lambda r: r["engagement"]["likes"], reverse=True)
    elif sort_by == "viral":
        results.sort(
            key=lambda r: r["engagement"]["likes"] + r["engagement"]["shares"] * 2,
            reverse=True,
        )
    else:
        results.sort(key=lambda r: r["posted_at"], reverse=True)

    summary = calculate_sentiment_summary(results)
    total = rng.randint(8000, 55000)

    words = query.lower().split() + ["trending", "debate", "news", "analysis"]
    keywords = [{"word": w, "count": rng.randint(800, 12000)} for w in words[:8]]
    keywords.sort(key=lambda k: k["count"], reverse=True)

    related = [f"#{w.title().replace(' ', '')}" for w in query.split()[:4]]
    related.extend(["#Trending", "#News", "#Opinion"])

    trend = list(SENTIMENT_TREND_24H)
    if time_range != "24h":
        trend = [
            {
                "time": f"Day {i + 1}",
                "positive": rng.randint(35, 70),
                "negative": rng.randint(15, 40),
                "neutral": rng.randint(10, 35),
            }
            for i in range(7)
        ]

    return {
        "query": query,
        "total_results": total,
        "sentiment_summary": summary,
        "platforms_searched": platforms,
        "demo_mode": True,
        "peak_discussion": "Today at 2:00 PM",
        "most_active_platform": "twitter",
        "results": results,
        "trending_keywords": keywords[:10],
        "related_topics": related[:6],
        "sentiment_trend": trend,
    }
