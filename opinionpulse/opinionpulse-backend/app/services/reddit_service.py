import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)

RATE_LIMIT_NOTE = (
    "Reddit Data API: 100 queries per minute per OAuth client ID. "
    "Monitor X-Ratelimit-Used, X-Ratelimit-Remaining, and X-Ratelimit-Reset headers."
)


class RedditConfigError(Exception):
    """Raised when Reddit OAuth credentials are missing or invalid."""


class RedditApiError(Exception):
    def __init__(self, message: str, *, rate_limited: bool = False):
        super().__init__(message)
        self.rate_limited = rate_limited


def reddit_credentials_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.reddit_client_id.strip()
        and settings.reddit_client_secret.strip()
        and settings.reddit_username.strip()
        and settings.reddit_password.strip()
        and settings.reddit_user_agent.strip()
    )


def get_reddit_client():
    """Return an authenticated PRAW Reddit client."""
    if not reddit_credentials_configured():
        raise RedditConfigError(
            "Reddit credentials are not configured. Set REDDIT_CLIENT_ID, "
            "REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, and "
            "REDDIT_USER_AGENT in backend .env."
        )

    try:
        import praw
    except ImportError as exc:
        raise RedditConfigError(
            "PRAW is not installed. Run: pip install praw"
        ) from exc

    settings = get_settings()
    return praw.Reddit(
        client_id=settings.reddit_client_id.strip(),
        client_secret=settings.reddit_client_secret.strip(),
        username=settings.reddit_username.strip(),
        password=settings.reddit_password.strip(),
        user_agent=settings.reddit_user_agent.strip(),
    )


def _utc_from_timestamp(ts: Optional[float]) -> Optional[datetime]:
    if ts is None:
        return None
    try:
        return datetime.fromtimestamp(float(ts), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _author_name(author: Any) -> str:
    if author is None:
        return "[deleted]"
    try:
        name = str(author)
        return name if name and name != "None" else "[deleted]"
    except Exception:
        return "[deleted]"


def _reddit_url(permalink: Optional[str]) -> Optional[str]:
    if not permalink:
        return None
    if permalink.startswith("http"):
        return permalink[:512]
    return f"https://www.reddit.com{permalink}"[:512]


def _submission_raw(submission: Any) -> Dict[str, Any]:
    subreddit = getattr(submission, "subreddit", None)
    return {
        "id": getattr(submission, "id", None),
        "title": getattr(submission, "title", None),
        "subreddit": str(subreddit) if subreddit is not None else None,
        "score": getattr(submission, "score", None),
        "permalink": getattr(submission, "permalink", None),
    }


def _comment_raw(comment: Any) -> Dict[str, Any]:
    return {
        "id": getattr(comment, "id", None),
        "link_id": getattr(comment, "link_id", None),
        "score": getattr(comment, "score", None),
        "body": getattr(comment, "body", None),
    }


def _is_rate_limit_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return (
        "rate limit" in msg
        or "429" in msg
        or "too many requests" in msg
        or "ratelimit" in msg
    )


def search_reddit_posts(query: str, max_posts: int = 10) -> List[Dict[str, Any]]:
    """Search Reddit posts across all subreddits."""
    query = query.strip()
    if not query:
        return []

    max_posts = max(1, min(max_posts, 100))
    reddit = get_reddit_client()
    posts: List[Dict[str, Any]] = []

    try:
        for submission in reddit.subreddit("all").search(
            query, limit=max_posts, sort="relevance"
        ):
            title = (getattr(submission, "title", None) or "").strip()
            selftext = (getattr(submission, "selftext", None) or "").strip()
            if selftext in ("[removed]", "[deleted]"):
                selftext = ""

            parts = [p for p in [title, selftext] if p]
            text = "\n\n".join(parts).strip()
            if not text:
                continue

            post_id = getattr(submission, "id", None)
            if not post_id:
                continue

            posts.append(
                {
                    "source_item_id": str(post_id)[:255],
                    "source_parent_id": None,
                    "author": _author_name(getattr(submission, "author", None)),
                    "text": text,
                    "url": _reddit_url(getattr(submission, "permalink", None)),
                    "published_at": _utc_from_timestamp(
                        getattr(submission, "created_utc", None)
                    ),
                    "engagement_score": int(getattr(submission, "score", 0) or 0),
                    "raw_json": _submission_raw(submission),
                }
            )
    except Exception as exc:
        if _is_rate_limit_error(exc):
            raise RedditApiError(
                "Reddit rate limit reached. Wait and retry with fewer keywords.",
                rate_limited=True,
            ) from exc
        logger.warning("Reddit search failed for %s: %s", query, exc)
        raise RedditApiError(f"Reddit search failed: {exc}") from exc

    return posts


def get_submission_comments(
    submission_id: str, max_comments: int = 10
) -> List[Dict[str, Any]]:
    """Collect top-level comments for a submission (no nested replies)."""
    submission_id = submission_id.strip()
    if not submission_id:
        return []

    max_comments = max(1, min(max_comments, 100))
    reddit = get_reddit_client()
    comments: List[Dict[str, Any]] = []

    try:
        submission = reddit.submission(id=submission_id)
        submission.comments.replace_more(limit=0)
        count = 0
        for top in submission.comments:
            if count >= max_comments:
                break
            if not hasattr(top, "body"):
                continue
            body = (top.body or "").strip()
            if not body or body in ("[removed]", "[deleted]"):
                continue

            comment_id = getattr(top, "id", None)
            if not comment_id:
                continue

            comments.append(
                {
                    "source_item_id": str(comment_id)[:255],
                    "source_parent_id": submission_id[:255],
                    "author": _author_name(getattr(top, "author", None)),
                    "text": body,
                    "url": _reddit_url(getattr(top, "permalink", None)),
                    "published_at": _utc_from_timestamp(
                        getattr(top, "created_utc", None)
                    ),
                    "engagement_score": int(getattr(top, "score", 0) or 0),
                    "raw_json": _comment_raw(top),
                }
            )
            count += 1
    except Exception as exc:
        if _is_rate_limit_error(exc):
            raise RedditApiError(
                "Reddit rate limit reached while fetching comments.",
                rate_limited=True,
            ) from exc
        logger.info("Skipping comments for submission %s: %s", submission_id, exc)
        return []

    return comments


def collect_reddit_for_keyword(
    keyword: str,
    max_posts: Optional[int] = None,
    max_comments: Optional[int] = None,
) -> Dict[str, Any]:
    """Search posts and collect top-level comments for one keyword."""
    settings = get_settings()
    max_posts = max_posts or settings.reddit_max_posts_per_keyword
    max_comments = max_comments or settings.reddit_max_comments_per_post

    result: Dict[str, Any] = {
        "keyword": keyword,
        "posts": [],
        "comments": [],
        "error": None,
        "rate_limited": False,
    }

    try:
        posts = search_reddit_posts(keyword, max_posts=max_posts)
        result["posts"] = posts
        for post in posts:
            post_id = post["source_item_id"]
            try:
                post_comments = get_submission_comments(
                    post_id, max_comments=max_comments
                )
                result["comments"].extend(post_comments)
            except RedditApiError as exc:
                if exc.rate_limited:
                    result["rate_limited"] = True
                    result["error"] = str(exc)
                    return result
    except RedditApiError as exc:
        result["error"] = str(exc)
        result["rate_limited"] = exc.rate_limited
    except RedditConfigError as exc:
        result["error"] = str(exc)

    return result
