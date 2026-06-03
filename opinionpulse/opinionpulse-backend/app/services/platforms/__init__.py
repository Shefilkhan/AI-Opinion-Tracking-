"""Free API platform fetchers for search and dashboard."""

from app.services.platforms.currents import search_currents
from app.services.platforms.devto import search_devto
from app.services.platforms.gnews import search_gnews
from app.services.platforms.guardian import search_guardian
from app.services.platforms.hackernews import search_hackernews
from app.services.platforms.mediastack import search_mediastack
from app.services.platforms.news_api import get_trending_news, search_news
from app.services.platforms.reddit_public import get_trending_reddit, search_reddit
from app.services.platforms.wikipedia import get_wikipedia_summary
from app.services.platforms.youtube_platform import get_trending_youtube, search_youtube

__all__ = [
    "search_reddit",
    "get_trending_reddit",
    "search_news",
    "get_trending_news",
    "search_youtube",
    "get_trending_youtube",
    "search_guardian",
    "search_mediastack",
    "search_currents",
    "search_gnews",
    "search_devto",
    "search_hackernews",
    "get_wikipedia_summary",
]
