"""Tests for YouTube Data API v3 platform integration (mocked HTTP)."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.services.platforms.youtube_client import YouTubeApiError
from app.services.platforms import youtube_platform
from app.services.youtube_analytics_service import build_youtube_summary


SEARCH_RESPONSE = {
    "items": [
        {
            "id": {"videoId": "abc12345678"},
            "snippet": {
                "title": "Samsung Galaxy Review",
                "description": "Full review of the latest Galaxy phone.",
                "channelTitle": "Tech Channel",
                "channelId": "UC123",
                "publishedAt": "2026-08-05T14:30:00Z",
                "thumbnails": {"medium": {"url": "https://img.example/thumb.jpg"}},
            },
        }
    ]
}

VIDEOS_RESPONSE = {
    "items": [
        {
            "id": "abc12345678",
            "snippet": {
                "title": "Samsung Galaxy Review",
                "description": "Full review of the latest Galaxy phone.",
                "channelTitle": "Tech Channel",
                "channelId": "UC123",
                "publishedAt": "2026-08-05T14:30:00Z",
                "thumbnails": {"medium": {"url": "https://img.example/thumb.jpg"}},
                "tags": ["samsung", "galaxy"],
            },
            "statistics": {
                "viewCount": "1250000",
                "likeCount": "52000",
                "commentCount": "8400",
            },
            "contentDetails": {"duration": "PT12M30S"},
        }
    ]
}

COMMENTS_RESPONSE = {
    "items": [
        {
            "id": "thread1",
            "snippet": {
                "totalReplyCount": 1,
                "topLevelComment": {
                    "id": "comment123",
                    "snippet": {
                        "textDisplay": "The battery life is terrible.",
                        "authorDisplayName": "Example User",
                        "likeCount": 1843,
                        "publishedAt": "2026-08-07T19:23:00Z",
                        "authorChannelId": {"value": "UCuser1"},
                    },
                },
                "replies": {
                    "comments": [
                        {
                            "id": "reply123",
                            "snippet": {
                                "textDisplay": "Mine has the same battery problem.",
                                "authorDisplayName": "Another User",
                                "likeCount": 81,
                                "publishedAt": "2026-08-07T20:02:00Z",
                            },
                        }
                    ]
                },
            },
        }
    ]
}


@pytest.fixture(autouse=True)
def _youtube_settings():
    with patch("app.services.platforms.youtube_platform.get_settings") as mock_settings, patch(
        "app.services.platforms.youtube_client.get_settings", mock_settings
    ), patch(
        "app.services.platforms.youtube_platform.api_key_configured", return_value=True
    ), patch(
        "app.services.platforms.youtube_client.api_key_configured", return_value=True
    ):
        settings = mock_settings.return_value
        settings.youtube_enabled = True
        settings.youtube_api_key = "test-key-not-placeholder-value-here"
        settings.youtube_max_videos_per_search = 10
        settings.youtube_comments_per_video = 50
        settings.youtube_max_replies_per_comment = 20
        settings.youtube_include_replies = True
        settings.youtube_cache_ttl_seconds = 900
        settings.youtube_max_concurrent_requests = 2
        settings.youtube_region_code = "US"
        settings.youtube_relevance_language = "en"
        yield mock_settings


@pytest.fixture(autouse=True)
def _bypass_cache():
    with patch("app.services.platforms.youtube_platform.cached", side_effect=lambda _k, fn, ttl_seconds=0: fn()):
        yield


def test_search_youtube_normalizes_video():
    def fake_get(endpoint, params):
        if endpoint == "search":
            return SEARCH_RESPONSE
        if endpoint == "videos":
            return VIDEOS_RESPONSE
        raise AssertionError(f"unexpected endpoint {endpoint}")

    with patch("app.services.platforms.youtube_platform.youtube_get", side_effect=fake_get):
        rows = youtube_platform.search_youtube("Samsung Galaxy", time_range="7d")

    assert len(rows) == 1
    row = rows[0]
    assert row["platform"] == "youtube"
    assert row["content_type"] == "video"
    assert row["id"] == "youtube:video:abc12345678"
    assert row["engagement"]["views"] == 1250000
    assert row["metadata"]["video_id"] == "abc12345678"
    assert row["metadata"]["audience_role"] == "creator"
    assert row["sentiment"] in ("positive", "negative", "neutral")


def test_search_youtube_zero_results():
    with patch(
        "app.services.platforms.youtube_platform.youtube_get",
        return_value={"items": []},
    ):
        rows = youtube_platform.search_youtube("nonexistent xyz query", time_range="7d")
    assert rows == []


def test_search_youtube_quota_exceeded():
    with patch(
        "app.services.platforms.youtube_platform.youtube_get",
        side_effect=YouTubeApiError("quota exceeded", quota_exceeded=True),
    ):
        with pytest.raises(ValueError, match="quota"):
            youtube_platform.search_youtube("Samsung Galaxy")


def test_fetch_comments_and_replies():
    video_row = {
        "platform": "youtube",
        "content_type": "video",
        "title": "Samsung Galaxy Review",
        "metadata": {"video_id": "abc12345678"},
        "source_url": "https://www.youtube.com/watch?v=abc12345678",
    }

    with patch(
        "app.services.platforms.youtube_platform.youtube_get",
        return_value=COMMENTS_RESPONSE,
    ):
        rows, stats = youtube_platform.fetch_youtube_audience_content(
            [video_row], "Samsung Galaxy"
        )

    assert stats["comments_fetched"] == 1
    assert stats["replies_fetched"] == 1
    assert len(rows) == 2
    comment = next(r for r in rows if r["content_type"] == "comment")
    reply = next(r for r in rows if r["content_type"] == "reply")
    assert comment["id"] == "youtube:comment:comment123"
    assert reply["id"] == "youtube:reply:reply123"
    assert reply["metadata"]["parent_comment_id"] == "comment123"
    assert comment["metadata"]["audience_role"] == "audience"


def test_comments_disabled_graceful():
    video_row = {
        "platform": "youtube",
        "content_type": "video",
        "title": "No Comments Video",
        "metadata": {"video_id": "xyz999xyz99"},
        "source_url": "https://www.youtube.com/watch?v=xyz999xyz99",
    }

    with patch(
        "app.services.platforms.youtube_platform.youtube_get",
        side_effect=YouTubeApiError("comments disabled", comments_disabled=True),
    ):
        rows, stats = youtube_platform.fetch_youtube_audience_content(
            [video_row], "test"
        )

    assert rows == []
    assert stats["comments_disabled_videos"] == 1


def test_build_youtube_summary_creator_vs_audience():
    video = {
        "platform": "youtube",
        "content_type": "video",
        "sentiment": "positive",
        "engagement": {"views": 1000, "likes": 100, "comments": 50},
        "title": "Galaxy review",
        "content": "Great camera",
    }
    comment = {
        "platform": "youtube",
        "content_type": "comment",
        "sentiment": "negative",
        "engagement": {"likes": 50},
        "content": "battery drains fast",
        "title": "Comment",
    }
    summary = build_youtube_summary([video, comment])
    assert summary is not None
    assert summary["videos_analyzed"] == 1
    assert summary["comments_analyzed"] == 1
    assert summary["creator_sentiment"]["positive"] == 100.0
    assert summary["audience_sentiment"]["negative"] == 100.0
    assert "engagement_weighted_audience_sentiment" in summary


def test_missing_api_key_raises_safe_error():
    with patch(
        "app.services.platforms.youtube_platform.api_key_configured",
        return_value=False,
    ):
        with pytest.raises(ValueError, match="not configured"):
            youtube_platform.search_youtube("test")


def test_duplicate_reply_prevention():
    video_row = {
        "platform": "youtube",
        "content_type": "video",
        "title": "Dup test",
        "metadata": {"video_id": "abc12345678"},
        "source_url": "https://www.youtube.com/watch?v=abc12345678",
    }
    duplicate_response = {
        "items": [
            {
                "id": "thread1",
                "snippet": {
                    "totalReplyCount": 0,
                    "topLevelComment": {
                        "id": "comment123",
                        "snippet": {
                            "textDisplay": "Same comment",
                            "authorDisplayName": "User",
                            "likeCount": 1,
                            "publishedAt": "2026-08-07T19:23:00Z",
                        },
                    },
                    "replies": {"comments": []},
                },
            },
            {
                "id": "thread2",
                "snippet": {
                    "totalReplyCount": 0,
                    "topLevelComment": {
                        "id": "comment123",
                        "snippet": {
                            "textDisplay": "Same comment duplicate",
                            "authorDisplayName": "User",
                            "likeCount": 2,
                            "publishedAt": "2026-08-07T19:24:00Z",
                        },
                    },
                    "replies": {"comments": []},
                },
            },
        ]
    }

    with patch(
        "app.services.platforms.youtube_platform.youtube_get",
        return_value=duplicate_response,
    ):
        rows, _ = youtube_platform.fetch_youtube_audience_content([video_row], "test")

    ids = [r["id"] for r in rows]
    assert len(ids) == len(set(ids))
