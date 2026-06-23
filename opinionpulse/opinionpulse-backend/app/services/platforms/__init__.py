"""Free API platform fetchers for search and dashboard."""

from app.services.platforms.currents import get_trending_currents, search_currents
from app.services.platforms.devto import search_devto
from app.services.platforms.gnews import get_trending_gnews, search_gnews
from app.services.platforms.guardian import get_trending_guardian, search_guardian
from app.services.platforms.hackernews import search_hackernews
from app.services.platforms.mediastack import get_trending_mediastack, search_mediastack
from app.services.platforms.news_api import get_trending_news, search_news
from app.services.platforms.news_trending import get_all_trending_news, get_all_trending_news_async
from app.services.platforms.reddit_public import get_trending_reddit, search_reddit
from app.services.platforms.wikipedia import get_wikipedia_summary
from app.services.platforms.youtube_platform import get_trending_youtube, search_youtube
from app.services.platforms.mastodon import search_mastodon
from app.services.platforms.github import search_github
from app.services.platforms.stackoverflow import search_stackoverflow
from app.services.platforms.bluesky import search_bluesky

__all__ = [
    "search_reddit",
    "get_trending_reddit",
    "search_news",
    "get_trending_news",
    "get_trending_gnews",
    "get_trending_guardian",
    "get_trending_currents",
    "get_trending_mediastack",
    "get_all_trending_news",
    "get_all_trending_news_async",
    "search_youtube",
    "get_trending_youtube",
    "search_guardian",
    "search_mediastack",
    "search_currents",
    "search_gnews",
    "search_devto",
    "search_hackernews",
    "get_wikipedia_summary",
    "search_mastodon",
    "search_github",
    "search_stackoverflow",
    "search_bluesky",
]
