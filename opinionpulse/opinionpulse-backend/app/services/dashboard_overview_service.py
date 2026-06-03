"""Dashboard overview data (mock stats for opinion tracking hub)."""

from app.services.search_mock_data import _seed
import random


def get_dashboard_overview() -> dict:
    rng = random.Random(_seed("dashboard"))
    return {
        "stats": {
            "searches_today": {
                "value": f"{rng.randint(800, 2400):,}",
                "subtitle": "searches performed today",
                "trend": f"↑ {rng.randint(5, 18)}% from yesterday",
                "trend_positive": True,
            },
            "topics_trending": {
                "value": str(rng.randint(28, 52)),
                "subtitle": "topics trending globally",
                "trend": f"↑ {rng.randint(3, 12)} new in last hour",
                "trend_positive": True,
            },
            "positive_sentiment": {
                "value": f"{rng.randint(58, 72)}%",
                "subtitle": "average positive sentiment",
                "trend": "",
                "trend_positive": True,
                "progress": rng.randint(58, 72),
            },
            "negative_sentiment": {
                "value": f"{rng.randint(28, 42)}%",
                "subtitle": "average negative sentiment",
                "trend": "",
                "trend_positive": False,
                "progress": rng.randint(28, 42),
            },
        },
        "trending_topics": [
            {"name": "#AI", "mentions": "24.3K", "sentiment": "positive", "trend": "up"},
            {"name": "#Climate", "mentions": "18.7K", "sentiment": "mixed", "trend": "up"},
            {"name": "#Bitcoin", "mentions": "31.2K", "sentiment": "negative", "trend": "down"},
            {"name": "#Elections2024", "mentions": "42.1K", "sentiment": "mixed", "trend": "up"},
            {"name": "#OpenAI", "mentions": "15.9K", "sentiment": "positive", "trend": "up"},
            {"name": "#Healthcare", "mentions": "9.4K", "sentiment": "positive", "trend": "up"},
            {"name": "#Ukraine", "mentions": "12.8K", "sentiment": "negative", "trend": "down"},
            {"name": "#Tesla", "mentions": "11.2K", "sentiment": "mixed", "trend": "up"},
            {"name": "#SpaceX", "mentions": "8.6K", "sentiment": "positive", "trend": "up"},
            {"name": "#Jobs", "mentions": "7.1K", "sentiment": "mixed", "trend": "down"},
        ],
        "debates": [
            {
                "id": "1",
                "title": "Is AI regulation moving too fast or too slow?",
                "platform": "twitter",
                "summary": "Lawmakers and tech leaders clash over guardrails as models advance weekly.",
                "positive_pct": 58,
                "negative_pct": 42,
                "time_ago": "2 hours ago",
                "query": "AI regulation",
            },
            {
                "id": "2",
                "title": "Climate policy: economic cost vs long-term survival",
                "platform": "reddit",
                "summary": "Thread with 2.4K comments debates carbon taxes and green subsidies.",
                "positive_pct": 45,
                "negative_pct": 55,
                "time_ago": "4 hours ago",
                "query": "Climate Change",
            },
            {
                "id": "3",
                "title": "Bitcoin ETF inflows — bubble or new institutional era?",
                "platform": "news",
                "summary": "Financial press split on whether retail is late to the party.",
                "positive_pct": 62,
                "negative_pct": 38,
                "time_ago": "5 hours ago",
                "query": "Bitcoin",
            },
            {
                "id": "4",
                "title": "Remote work mandates: productivity win or talent drain?",
                "platform": "twitter",
                "summary": "Employees and CEOs post opposing takes with viral engagement.",
                "positive_pct": 51,
                "negative_pct": 49,
                "time_ago": "6 hours ago",
                "query": "remote work",
            },
            {
                "id": "5",
                "title": "YouTube creators vs traditional news trust",
                "platform": "youtube",
                "summary": "Comment sections show generational divide on information sources.",
                "positive_pct": 70,
                "negative_pct": 30,
                "time_ago": "8 hours ago",
                "query": "media trust",
            },
            {
                "id": "6",
                "title": "Healthcare AI diagnostics — hope or liability risk?",
                "platform": "news",
                "summary": "Hospitals pilot tools while ethicists warn of bias in training data.",
                "positive_pct": 64,
                "negative_pct": 36,
                "time_ago": "10 hours ago",
                "query": "Healthcare AI",
            },
        ],
        "platform_pulse": [
            {
                "platform": "twitter",
                "label": "Twitter/X",
                "mentions": "45,231 mentions today",
                "positive_pct": 78,
            },
            {
                "platform": "reddit",
                "label": "Reddit",
                "mentions": "12,847 posts today",
                "positive_pct": 61,
            },
            {
                "platform": "youtube",
                "label": "YouTube",
                "mentions": "8,432 comments analyzed",
                "positive_pct": 70,
            },
            {
                "platform": "news",
                "label": "News Sites",
                "mentions": "3,891 articles",
                "positive_pct": 52,
            },
        ],
        "demo_mode": True,
    }
