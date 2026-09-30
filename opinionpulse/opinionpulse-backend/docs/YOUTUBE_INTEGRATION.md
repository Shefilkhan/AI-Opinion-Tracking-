# YouTube Data API v3 Integration

OpinionPulse queries YouTube through the FastAPI backend only. The API key never reaches the browser.

## Setup

1. Create or select a [Google Cloud project](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3** (APIs & Services → Library).
3. Create an **API key** (APIs & Services → Credentials).
4. Restrict the key to YouTube Data API v3 and your server IP where possible.
5. Add to backend `.env.local`:

```env
YOUTUBE_API_KEY=your_key_here
YOUTUBE_ENABLED=true
```

See `.env.example` for optional limits (videos per search, comments per video, cache TTL, concurrency).

## Request flow

```text
User search query
    ↓
search_service.run_search()
    ↓
youtube_platform.search_youtube()
    ├── search.list  → video IDs
    └── videos.list  → metadata + statistics (batched)
    ↓
fetch_youtube_audience_content()
    ├── commentThreads.list  → top comments (+ embedded replies)
    └── comments.list        → additional replies when needed
    ↓
platform_common.build_result() + sentiment_analysis
    ↓
spam / relevance / dedup filters
    ↓
youtube_analytics_service.build_youtube_summary()
    ├── creator sentiment (video title + description)
    ├── audience sentiment (comments + replies)
    └── engagement-weighted audience (1 + log1p(likes))
```

## Quota-conscious behavior

- Results cached (`YOUTUBE_CACHE_TTL_SECONDS`, default 900s).
- Video details fetched in batches of up to 50 IDs per `videos.list` call.
- Comment fetching uses bounded thread pool (`YOUTUBE_MAX_CONCURRENT_REQUESTS`).
- Crisis Radar / scheduled scans use smaller limits automatically.
- Quota errors return partial results; other platforms continue unaffected.

## Stable IDs (deduplication)

```text
youtube:video:{video_id}
youtube:comment:{comment_id}
youtube:reply:{reply_id}
```

## Known limitations

- YouTube API daily quota (default 10,000 units/day on free tier).
- Comments disabled on some videos — video still appears, comments skipped.
- Not every YouTube comment is fetched; limits are configurable.
- Reply trees may be sampled, not exhaustive.
- Private/deleted videos are omitted when the API returns no data.
